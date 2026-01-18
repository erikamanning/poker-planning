import { App, ViewSubmitAction, AllMiddlewareArgs, SlackViewMiddlewareArgs } from '@slack/bolt';
import { parseJiraCsv, validateCsvContent } from '../services/csv-parser';
import { createSession, getCurrentTicket, updateSessionMessageTs } from '../services/session';
import { getVotingBlocks } from '../views/blocks';

interface FileInfo {
  id: string;
  name?: string;
}

async function fetchFileContent(client: any, fileId: string): Promise<string> {
  const fileInfo = await client.files.info({ file: fileId });

  if (!fileInfo.file?.url_private) {
    throw new Error('Could not get file URL');
  }

  // Fetch file content using the bot token
  const response = await fetch(fileInfo.file.url_private, {
    headers: {
      Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`);
  }

  return response.text();
}

export function registerModalHandlers(app: App): void {
  app.view('csv_submit', async ({ ack, body, view, client, logger }) => {
    const pastedContent = view.state.values.csv_input_block?.csv_content?.value || '';
    const uploadedFiles = view.state.values.csv_file_block?.csv_file?.files as FileInfo[] | undefined;

    let csvContent = '';

    // Check if file was uploaded
    if (uploadedFiles && uploadedFiles.length > 0) {
      try {
        csvContent = await fetchFileContent(client, uploadedFiles[0].id);
      } catch (error) {
        await ack({
          response_action: 'errors',
          errors: {
            csv_file_block: `Failed to read uploaded file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        });
        return;
      }
    } else if (pastedContent) {
      csvContent = pastedContent;
    } else {
      await ack({
        response_action: 'errors',
        errors: {
          csv_input_block: 'Please upload a CSV file or paste CSV content',
        },
      });
      return;
    }

    // Validate CSV
    const validation = validateCsvContent(csvContent);
    if (!validation.valid) {
      const errorBlock = uploadedFiles && uploadedFiles.length > 0 ? 'csv_file_block' : 'csv_input_block';
      await ack({
        response_action: 'errors',
        errors: {
          [errorBlock]: validation.error || 'Invalid CSV content',
        },
      });
      return;
    }

    await ack();

    try {
      // Parse tickets
      const tickets = parseJiraCsv(csvContent);

      // Get channel from private_metadata or use a default approach
      // For modals opened from slash commands, we need to store channel in metadata
      // Since we didn't store it, we'll need to get it from the response_urls or find another way
      // For now, let's use the user's DM if no channel is specified

      // Actually, the view submission doesn't have channel info directly.
      // We need to post back to where the command was issued.
      // The best approach is to store channel_id in private_metadata when opening the modal.
      // Let me update the modal to include this.

      // For now, we'll use a workaround - post to a channel the user is in
      // This is a limitation we'll fix by passing channel_id in private_metadata

      const channelId = view.private_metadata || '';

      if (!channelId) {
        logger.error('No channel ID found in modal submission');
        return;
      }

      const facilitatorId = body.user.id;

      // Create session
      const session = createSession(channelId, facilitatorId, tickets);
      const currentTicket = getCurrentTicket(session);

      if (!currentTicket) {
        logger.error('No current ticket found after creating session');
        return;
      }

      // Post first ticket for voting
      const result = await client.chat.postMessage({
        channel: channelId,
        text: `Planning session started! Voting on: ${currentTicket.key}`,
        blocks: getVotingBlocks(
          session.id,
          currentTicket,
          session.currentTicketIndex,
          session.tickets.length
        ),
      });

      if (result.ts) {
        updateSessionMessageTs(session.id, result.ts);
      }
    } catch (error) {
      logger.error('Error processing CSV submission:', error);
    }
  });
}
