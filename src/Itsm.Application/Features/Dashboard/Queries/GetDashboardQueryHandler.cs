using Itsm.Application.Abstractions;
using Itsm.Application.Common;
using Itsm.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Itsm.Application.Features.Dashboard.Queries;

internal sealed class GetDashboardQueryHandler(IAppDbContext db)
    : IRequestHandler<GetDashboardQuery, Result<DashboardResponse>>
{
    public async Task<Result<DashboardResponse>> Handle(GetDashboardQuery request, CancellationToken cancellationToken)
    {
        var openTickets = await db.Tickets.CountAsync(t => t.Status == TicketStatus.Open, cancellationToken);
        var closedTickets = await db.Tickets.CountAsync(t => t.Status == TicketStatus.Closed, cancellationToken);
        var slaBreached = await db.Tickets.CountAsync(t => t.IsSlaBreached, cancellationToken);

        var agentCounts = await db.Tickets
            .Where(t => t.AssignedToId != null)
            .Include(t => t.AssignedTo)
            .GroupBy(t => new { t.AssignedToId, t.AssignedTo!.FirstName, t.AssignedTo.LastName })
            .Select(g => new AgentTicketCount($"{g.Key.FirstName} {g.Key.LastName}", g.Count()))
            .ToListAsync(cancellationToken);

        return new DashboardResponse(openTickets, closedTickets, slaBreached, agentCounts);
    }
}
