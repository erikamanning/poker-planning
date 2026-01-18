import { ModalView } from '@slack/bolt';

export function getCsvInputModal(channelId: string): ModalView {
  return {
    type: 'modal',
    callback_id: 'csv_submit',
    private_metadata: channelId,
    title: {
      type: 'plain_text',
      text: 'Start Planning Session',
    },
    submit: {
      type: 'plain_text',
      text: 'Start Session',
    },
    close: {
      type: 'plain_text',
      text: 'Cancel',
    },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Upload a Jira CSV export or paste the content below. The CSV should have *Issue key* and *Summary* columns.',
        },
      },
      {
        type: 'input',
        block_id: 'csv_file_block',
        optional: true,
        element: {
          type: 'file_input',
          action_id: 'csv_file',
          filetypes: ['csv', 'text'],
          max_files: 1,
        },
        label: {
          type: 'plain_text',
          text: 'Upload CSV File',
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'context',
        elements: [
          {
            type: 'plain_text',
            text: 'Or paste CSV content directly:',
          },
        ],
      },
      {
        type: 'input',
        block_id: 'csv_input_block',
        optional: true,
        element: {
          type: 'plain_text_input',
          action_id: 'csv_content',
          multiline: true,
          placeholder: {
            type: 'plain_text',
            text: 'Issue key,Summary\nPROJ-123,Fix login bug\nPROJ-124,Add dark mode',
          },
        },
        label: {
          type: 'plain_text',
          text: 'CSV Content',
        },
      },
    ],
  };
}
