import { App } from '@slack/bolt';
import { getCsvInputModal } from '../views/modals';
import { getSessionByChannel } from '../services/session';

export function registerCommands(app: App): void {
  app.command('/planning', async ({ command, ack, client, logger }) => {
    await ack();

    // Check if there's already an active session in this channel
    const existingSession = getSessionByChannel(command.channel_id);
    if (existingSession) {
      await client.chat.postEphemeral({
        channel: command.channel_id,
        user: command.user_id,
        text: 'There is already an active planning session in this channel. Please end it before starting a new one.',
      });
      return;
    }

    try {
      await client.views.open({
        trigger_id: command.trigger_id,
        view: getCsvInputModal(command.channel_id),
      });
    } catch (error) {
      logger.error('Error opening modal:', error);
    }
  });
}
