export type Size = 'S' | 'M' | 'L';

export interface Vote {
  uncertainty?: Size;
  complexity?: Size;
  effort?: Size;
}

export interface UserVote {
  userId: string;
  userName: string;
  vote: Vote;
  points?: number;
}

export interface Ticket {
  key: string;
  summary: string;
  votes: Map<string, UserVote>;
  revealed: boolean;
  finalPoints?: number;
}

export interface Session {
  id: string;
  channelId: string;
  facilitatorId: string;
  tickets: Ticket[];
  currentTicketIndex: number;
  messageTs?: string;
  createdAt: Date;
}

export interface ParsedTicket {
  key: string;
  summary: string;
}

export interface VoteResult {
  userId: string;
  userName: string;
  uncertainty: Size;
  complexity: Size;
  effort: Size;
  points: number;
}
