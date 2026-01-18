import { Session, Ticket, ParsedTicket, UserVote, Vote, Size } from '../types';
import { calculatePoints } from './points';

// In-memory session store (can be replaced with Redis/DB later)
const sessions = new Map<string, Session>();

// Also store by channel for easy lookup
const sessionsByChannel = new Map<string, string>();

export function createSession(
  channelId: string,
  facilitatorId: string,
  parsedTickets: ParsedTicket[]
): Session {
  const sessionId = generateSessionId();

  const tickets: Ticket[] = parsedTickets.map((pt) => ({
    key: pt.key,
    summary: pt.summary,
    votes: new Map(),
    revealed: false,
  }));

  const session: Session = {
    id: sessionId,
    channelId,
    facilitatorId,
    tickets,
    currentTicketIndex: 0,
    createdAt: new Date(),
  };

  sessions.set(sessionId, session);
  sessionsByChannel.set(channelId, sessionId);

  return session;
}

export function getSession(sessionId: string): Session | undefined {
  return sessions.get(sessionId);
}

export function getSessionByChannel(channelId: string): Session | undefined {
  const sessionId = sessionsByChannel.get(channelId);
  if (sessionId) {
    return sessions.get(sessionId);
  }
  return undefined;
}

export function updateSessionMessageTs(sessionId: string, messageTs: string): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.messageTs = messageTs;
  }
}

export function getCurrentTicket(session: Session): Ticket | undefined {
  return session.tickets[session.currentTicketIndex];
}

export function recordVote(
  sessionId: string,
  userId: string,
  userName: string,
  category: 'uncertainty' | 'complexity' | 'effort',
  size: Size
): UserVote | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  const ticket = getCurrentTicket(session);
  if (!ticket) return undefined;

  let userVote = ticket.votes.get(userId);
  if (!userVote) {
    userVote = {
      userId,
      userName,
      vote: {},
    };
    ticket.votes.set(userId, userVote);
  }

  userVote.vote[category] = size;

  // Calculate points if vote is complete
  const points = calculatePoints(userVote.vote);
  if (points !== null) {
    userVote.points = points;
  }

  return userVote;
}

export function getUserVote(sessionId: string, userId: string): UserVote | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  const ticket = getCurrentTicket(session);
  if (!ticket) return undefined;

  return ticket.votes.get(userId);
}

export function revealCurrentTicket(sessionId: string): Ticket | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  const ticket = getCurrentTicket(session);
  if (!ticket) return undefined;

  ticket.revealed = true;

  // Calculate final points (average rounded to nearest Fibonacci)
  const completedVotes = Array.from(ticket.votes.values()).filter(
    (v) => v.points !== undefined
  );

  if (completedVotes.length > 0) {
    const avgPoints =
      completedVotes.reduce((sum, v) => sum + (v.points || 0), 0) / completedVotes.length;
    ticket.finalPoints = roundToFibonacci(avgPoints);
  }

  return ticket;
}

export function advanceToNextTicket(sessionId: string): { ticket: Ticket; index: number } | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  if (session.currentTicketIndex < session.tickets.length - 1) {
    session.currentTicketIndex++;
    const ticket = getCurrentTicket(session);
    if (ticket) {
      return { ticket, index: session.currentTicketIndex };
    }
  }

  return null;
}

export function isLastTicket(session: Session): boolean {
  return session.currentTicketIndex >= session.tickets.length - 1;
}

export function endSession(sessionId: string): Session | undefined {
  const session = sessions.get(sessionId);
  if (session) {
    sessionsByChannel.delete(session.channelId);
    sessions.delete(sessionId);
  }
  return session;
}

export function getSessionSummary(session: Session): {
  tickets: Array<{
    key: string;
    summary: string;
    finalPoints: number | undefined;
    voteCount: number;
  }>;
  totalPoints: number;
} {
  const tickets = session.tickets.map((t) => ({
    key: t.key,
    summary: t.summary,
    finalPoints: t.finalPoints,
    voteCount: t.votes.size,
  }));

  const totalPoints = tickets.reduce((sum, t) => sum + (t.finalPoints || 0), 0);

  return { tickets, totalPoints };
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function roundToFibonacci(value: number): number {
  const fibSequence = [1, 2, 3, 5, 8, 13, 21];

  let closest = fibSequence[0];
  let minDiff = Math.abs(value - closest);

  for (const fib of fibSequence) {
    const diff = Math.abs(value - fib);
    if (diff < minDiff) {
      minDiff = diff;
      closest = fib;
    }
  }

  return closest;
}
