import { App } from '@slack/bolt';
import { Size } from '../types';
import {
  getSession,
  getCurrentTicket,
  recordVote,
  getUserVote,
} from '../services/session';
import { getVotingBlocks } from '../views/blocks';
import { isVoteComplete, calculatePoints } from '../services/points';

type VoteCategory = 'uncertainty' | 'complexity' | 'effort';

export function registerVotingHandlers(app: App): void {
  // Register handlers for all vote combinations
  const categories: VoteCategory[] = ['uncertainty', 'complexity', 'effort'];
  const sizes: Size[] = ['S', 'M', 'L'];

  for (const category of categories) {
    for (const size of sizes) {
      const actionId = `vote_${category}_${size}`;

      app.action(actionId, async ({ ack, body, client, logger, action }) => {
        await ack();

        if (body.type !== 'block_actions' || !('value' in action)) {
          return;
        }

        const sessionId = action.value;
        if (!sessionId) {
          logger.error('No session ID in vote action');
          return;
        }

        const session = getSession(sessionId);
        if (!session) {
          logger.error('Session not found:', sessionId);
          return;
        }

        const userId = body.user.id;
        const userName = body.user.name || body.user.id;

        // Record the vote
        const userVote = recordVote(sessionId, userId, userName, category, size);
        if (!userVote) {
          logger.error('Failed to record vote');
          return;
        }

        const currentTicket = getCurrentTicket(session);
        if (!currentTicket) {
          return;
        }

        // Check if user completed their vote
        if (isVoteComplete(userVote.vote)) {
          const points = calculatePoints(userVote.vote);
          if (points !== null) {
            // Send ephemeral message with their points
            await client.chat.postEphemeral({
              channel: session.channelId,
              user: userId,
              text: `Your vote: U:${userVote.vote.uncertainty} C:${userVote.vote.complexity} E:${userVote.vote.effort} = *${points} points*`,
            });
          }
        }

        // Update the message with new vote count
        if (session.messageTs) {
          try {
            await client.chat.update({
              channel: session.channelId,
              ts: session.messageTs,
              text: `Voting on: ${currentTicket.key}`,
              blocks: getVotingBlocks(
                session.id,
                currentTicket,
                session.currentTicketIndex,
                session.tickets.length,
                getUserVote(sessionId, userId)?.vote,
                session.facilitatorId
              ),
            });
          } catch (error) {
            logger.error('Error updating voting message:', error);
          }
        }
      });
    }
  }
}
