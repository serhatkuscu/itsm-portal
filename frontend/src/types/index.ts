// ── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
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

export interface PriorityCount  { priority: string; count: number; }
export interface AgentCount     { agentName: string; ticketCount: number; }
export interface RecentTicket   { id: string; title: string; status: string; priority: string; createdAt: string; }

// ── Tickets ───────────────────────────────────────────────────────────────────
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TicketListItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  requesterName: string;
  assignedToName: string | null;
  dueDate: string;
  isSlaBreached: boolean;
  createdAt: string;
}

export interface TicketDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  requesterName: string;
  assignedToName: string | null;
  dueDate: string;
  isSlaBreached: boolean;
  createdAt: string;
  updatedAt: string | null;
  comments: CommentDetail[];
  auditLogs: AuditDetail[];
}

export interface CommentDetail {
  id: string;
  authorName: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

export interface AuditDetail {
  field: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

// ── Create Ticket ─────────────────────────────────────────────────────────────
export interface CreateTicketResponse {
  ticketId: string;
  title: string;
  dueDate: string;
}
