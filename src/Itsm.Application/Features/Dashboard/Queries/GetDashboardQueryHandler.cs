using Itsm.Application.Abstractions;
using Itsm.Application.Common;
using Itsm.Domain.Entities;
using Itsm.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Itsm.Application.Features.Dashboard.Queries;

internal sealed class GetDashboardQueryHandler(IAppDbContext db, ICurrentUser currentUser)
    : IRequestHandler<GetDashboardQuery, Result<DashboardResponse>>
{
    public async Task<Result<DashboardResponse>> Handle(GetDashboardQuery request, CancellationToken cancellationToken)
    {
        var baseQuery = BuildBaseQuery();

        var counts = await baseQuery
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Total        = g.Count(),
                Open         = g.Count(t => t.Status == TicketStatus.Open),
                InProgress   = g.Count(t => t.Status == TicketStatus.InProgress),
                Resolved     = g.Count(t => t.Status == TicketStatus.Resolved),
                Closed       = g.Count(t => t.Status == TicketStatus.Closed),
                SlaBreached  = g.Count(t => t.IsSlaBreached),
                SlaWarnSent  = g.Count(t => t.SlaWarningSent),
            })
            .FirstOrDefaultAsync(cancellationToken);

        var byPriorityRaw = await baseQuery
            .GroupBy(t => t.Priority)
            .Select(g => new { Priority = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var byPriority = byPriorityRaw
            .OrderBy(x => x.Priority)
            .Select(x => new PriorityTicketCount(x.Priority.ToString(), x.Count))
            .ToList();

        var byAgent = currentUser.Role == UserRole.Admin
            ? await db.Tickets
                .Where(t => t.AssignedToId != null)
                .GroupBy(t => new { t.AssignedToId, t.AssignedTo!.FirstName, t.AssignedTo.LastName })
                .Select(g => new AgentTicketCount($"{g.Key.FirstName} {g.Key.LastName}", g.Count()))
                .ToListAsync(cancellationToken)
            : (IReadOnlyList<AgentTicketCount>)[];

        var recentRaw = await baseQuery
            .OrderByDescending(t => t.CreatedAt)
            .Take(5)
            .Select(t => new { t.Id, t.Title, t.Status, t.Priority, t.CreatedAt })
            .ToListAsync(cancellationToken);

        var recentTickets = recentRaw
            .Select(t => new RecentTicket(t.Id, t.Title, t.Status.ToString(), t.Priority.ToString(), t.CreatedAt))
            .ToList();

        return new DashboardResponse(
            counts?.Total       ?? 0,
            counts?.Open        ?? 0,
            counts?.InProgress  ?? 0,
            counts?.Resolved    ?? 0,
            counts?.Closed      ?? 0,
            counts?.SlaBreached ?? 0,
            counts?.SlaWarnSent ?? 0,
            byPriority,
            byAgent,
            recentTickets
        );
    }

    private IQueryable<Ticket> BuildBaseQuery() => currentUser.Role switch
    {
        UserRole.Agent     => db.Tickets.Where(t => t.AssignedToId == currentUser.Id),
        UserRole.Requester => db.Tickets.Where(t => t.RequesterId  == currentUser.Id),
        _                  => db.Tickets  // Admin: all
    };
}
