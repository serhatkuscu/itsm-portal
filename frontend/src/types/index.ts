export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface DashboardResponse {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  slaBreachedTickets: number;
  slaWarningSentTickets: number;
  byPriority: PriorityCount[];
  byAgent: AgentCount[];
  recentTickets: RecentTicket[];
}

export interface PriorityCount {
  priority: string;
  count: number;
}

export interface AgentCount {
  agentName: string;
  ticketCount: number;
}

export interface RecentTicket {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
}
