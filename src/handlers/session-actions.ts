import { App } from '@slack/bolt';
import {
  getSession,
  getCurrentTicket,
  revealCurrentTicket,
  advanceToNextTicket,
  isLastTicket,
  endSession,
  getSessionSummary,
  updateSessionMessageTs,
} from '../services/session';
import { getResultsBlocks, getVotingBlocks, getSessionSummaryBlocks } from '../views/blocks';

export function registerSessionActionHandlers(app: App): void {
  // Reveal Results
  app.action('reveal_results', async ({ ack, body, client, logger, action }) => {
    await ack();

    if (body.type !== 'block_actions' || !('value' in action)) {
      return;
    }

    const sessionId = action.value;
    if (!sessionId) {
      logger.error('No session ID in reveal action');
      return;
    }

    const session = getSession(sessionId);
    if (!session) {
      logger.error('Session not found:', sessionId);
      return;
    }

    // Check if user is facilitator
    if (body.user.id !== session.facilitatorId) {
      await client.chat.postEphemeral({
        channel: session.channelId,
        user: body.user.id,
        text: 'Only the facilitator can reveal results.',
      });
      return;
    }

    // Reveal the current ticket
    const ticket = revealCurrentTicket(sessionId);
    if (!ticket) {
      logger.error('Failed to reveal ticket');
      return;
    }

    // Update message with results
    if (session.messageTs) {
      try {
        await client.chat.update({
          channel: session.channelId,
          ts: session.messageTs,
          text: `Results for: ${ticket.key}`,
          blocks: getResultsBlocks(
            session.id,
            ticket,
            session.currentTicketIndex,
            session.tickets.length,
            isLastTicket(session)
          ),
        });
      } catch (error) {
        logger.error('Error updating message with results:', error);
      }
    }
  });

  // Next Ticket
  app.action('next_ticket', async ({ ack, body, client, logger, action }) => {
    await ack();

    if (body.type !== 'block_actions' || !('value' in action)) {
      return;
    }

    const sessionId = action.value;
    if (!sessionId) {
      logger.error('No session ID in next ticket action');
      return;
    }

    const session = getSession(sessionId);
    if (!session) {
      logger.error('Session not found:', sessionId);
      return;
    }

    // Check if user is facilitator
    if (body.user.id !== session.facilitatorId) {
      await client.chat.postEphemeral({
        channel: session.channelId,
        user: body.user.id,
        text: 'Only the facilitator can advance to the next ticket.',
      });
      return;
    }

    // Advance to next ticket
    const result = advanceToNextTicket(sessionId);
    if (!result) {
      logger.error('Failed to advance to next ticket');
      return;
    }

    // Post new message for next ticket
    try {
      const messageResult = await client.chat.postMessage({
        channel: session.channelId,
        text: `Voting on: ${result.ticket.key}`,
        blocks: getVotingBlocks(
          session.id,
          result.ticket,
          result.index,
          session.tickets.length
        ),
      });

      if (messageResult.ts) {
        updateSessionMessageTs(sessionId, messageResult.ts);
      }
    } catch (error) {
      logger.error('Error posting next ticket message:', error);
    }
  });

  // End Session
  app.action('end_session', async ({ ack, body, client, logger, action }) => {
    await ack();

    if (body.type !== 'block_actions' || !('value' in action)) {
      return;
    }

    const sessionId = action.value;
    if (!sessionId) {
      logger.error('No session ID in end session action');
      return;
    }

    const session = getSession(sessionId);
    if (!session) {
      logger.error('Session not found:', sessionId);
      return;
    }

    // Check if user is facilitator
    if (body.user.id !== session.facilitatorId) {
      await client.chat.postEphemeral({
        channel: session.channelId,
        user: body.user.id,
        text: 'Only the facilitator can end the session.',
      });
      return;
    }

    // Get summary before ending
    const summary = getSessionSummary(session);

    // End the session
    endSession(sessionId);

    // Post summary message
    try {
      await client.chat.postMessage({
        channel: session.channelId,
        text: 'Planning Session Complete!',
        blocks: getSessionSummaryBlocks(session, summary),
      });
    } catch (error) {
      logger.error('Error posting session summary:', error);
    }
  });
}
