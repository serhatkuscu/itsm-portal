using Itsm.Application.Common;
using MediatR;

namespace Itsm.Application.Features.Dashboard.Queries;

public sealed record GetDashboardQuery : IRequest<Result<DashboardResponse>>;

public sealed record DashboardResponse(
    int OpenTickets,
    int ClosedTickets,
    int SlaBreachedTickets,
    IReadOnlyList<AgentTicketCount> AgentTicketCounts
);

public sealed record AgentTicketCount(string AgentName, int TicketCount);
