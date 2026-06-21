using Itsm.Application.Common;
using MediatR;

namespace Itsm.Application.Features.Dashboard.Queries;

public sealed record GetDashboardQuery : IRequest<Result<DashboardResponse>>;

public sealed record DashboardResponse(
    int TotalTickets,
    int OpenTickets,
    int InProgressTickets,
    int ResolvedTickets,
    int ClosedTickets,
    int SlaBreachedTickets,
    int SlaWarningSentTickets,
    IReadOnlyList<PriorityTicketCount> ByPriority,
    IReadOnlyList<AgentTicketCount> ByAgent,
    IReadOnlyList<RecentTicket> RecentTickets
);

public sealed record PriorityTicketCount(string Priority, int Count);
public sealed record AgentTicketCount(string AgentName, int TicketCount);
public sealed record RecentTicket(Guid Id, string Title, string Status, string Priority, DateTime CreatedAt);
