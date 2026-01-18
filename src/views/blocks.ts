import { KnownBlock, Button } from '@slack/bolt';
import { Ticket, UserVote, Vote, Size, Session } from '../types';
import { getSizeLabel } from '../services/points';

export function getVotingBlocks(
  sessionId: string,
  ticket: Ticket,
  ticketIndex: number,
  totalTickets: number,
  userVote?: Vote,
  facilitatorId?: string
): KnownBlock[] {
  const blocks: KnownBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `Ticket ${ticketIndex + 1} of ${totalTickets}: ${ticket.key}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ticket.summary,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Vote below (points hidden until revealed):*',
      },
    },
  ];

  // Uncertainty row
  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*Uncertainty:* ${userVote?.uncertainty ? `_${getSizeLabel(userVote.uncertainty)}_` : ''}`,
    },
    accessory: undefined,
  });
  blocks.push(getVoteButtonRow(sessionId, 'uncertainty', userVote?.uncertainty));

  // Complexity row
  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*Complexity:* ${userVote?.complexity ? `_${getSizeLabel(userVote.complexity)}_` : ''}`,
    },
  });
  blocks.push(getVoteButtonRow(sessionId, 'complexity', userVote?.complexity));

  // Effort row
  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*Effort:* ${userVote?.effort ? `_${getSizeLabel(userVote.effort)}_` : ''}`,
    },
  });
  blocks.push(getVoteButtonRow(sessionId, 'effort', userVote?.effort));

  blocks.push({ type: 'divider' });

  // Vote count
  const voteCount = ticket.votes.size;
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `${voteCount} vote${voteCount !== 1 ? 's' : ''} submitted`,
      },
    ],
  });

  // Facilitator controls
  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Reveal Results',
        },
        style: 'primary',
        action_id: 'reveal_results',
        value: sessionId,
      },
    ],
  });

  return blocks;
}

function getVoteButtonRow(
  sessionId: string,
  category: 'uncertainty' | 'complexity' | 'effort',
  selected?: Size
): KnownBlock {
  const sizes: Size[] = ['S', 'M', 'L'];
  const buttons: Button[] = sizes.map((size) => ({
    type: 'button' as const,
    text: {
      type: 'plain_text' as const,
      text: selected === size ? `${getSizeLabel(size)} ✓` : getSizeLabel(size),
    },
    action_id: `vote_${category}_${size}`,
    value: sessionId,
    style: selected === size ? 'primary' : undefined,
  }));

  return {
    type: 'actions',
    elements: buttons,
  };
}

export function getResultsBlocks(
  sessionId: string,
  ticket: Ticket,
  ticketIndex: number,
  totalTickets: number,
  isLastTicket: boolean
): KnownBlock[] {
  const blocks: KnownBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `Results: ${ticket.key}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ticket.summary,
      },
    },
    {
      type: 'divider',
    },
  ];

  // Individual votes
  const votes = Array.from(ticket.votes.values());
  if (votes.length === 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '_No votes were submitted_',
      },
    });
  } else {
    let voteText = '*Votes:*\n';
    for (const userVote of votes) {
      const u = userVote.vote.uncertainty || '-';
      const c = userVote.vote.complexity || '-';
      const e = userVote.vote.effort || '-';
      const points = userVote.points ?? '-';
      voteText += `• <@${userVote.userId}>: U:${u} C:${c} E:${e} → *${points} pts*\n`;
    }
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: voteText,
      },
    });
  }

  // Final points
  if (ticket.finalPoints !== undefined) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Final Points: ${ticket.finalPoints}*`,
      },
    });
  }

  blocks.push({ type: 'divider' });

  // Navigation buttons
  const actionElements: Button[] = [];

  if (!isLastTicket) {
    actionElements.push({
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'Next Ticket',
      },
      style: 'primary',
      action_id: 'next_ticket',
      value: sessionId,
    });
  }

  actionElements.push({
    type: 'button',
    text: {
      type: 'plain_text',
      text: isLastTicket ? 'End Session' : 'End Session Early',
    },
    action_id: 'end_session',
    value: sessionId,
    style: isLastTicket ? 'primary' : undefined,
  });

  blocks.push({
    type: 'actions',
    elements: actionElements,
  });

  return blocks;
}

export function getSessionSummaryBlocks(
  session: Session,
  summary: {
    tickets: Array<{
      key: string;
      summary: string;
      finalPoints: number | undefined;
      voteCount: number;
    }>;
    totalPoints: number;
  }
): KnownBlock[] {
  const blocks: KnownBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: 'Planning Session Complete!',
      },
    },
    {
      type: 'divider',
    },
  ];

  // List all tickets with their points
  let ticketList = '*Ticket Summary:*\n';
  for (const ticket of summary.tickets) {
    const points = ticket.finalPoints !== undefined ? `${ticket.finalPoints} pts` : 'No votes';
    ticketList += `• *${ticket.key}*: ${points}\n`;
    ticketList += `  _${truncate(ticket.summary, 50)}_\n`;
  }

  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: ticketList,
    },
  });

  blocks.push({ type: 'divider' });

  // Total points
  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*Total Story Points: ${summary.totalPoints}*`,
    },
  });

  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Session facilitated by <@${session.facilitatorId}>`,
      },
    ],
  });

  return blocks;
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}
