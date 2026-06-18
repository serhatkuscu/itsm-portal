using Itsm.Application.Abstractions;
using Itsm.Application.Common;
using Itsm.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Itsm.Application.Features.Tickets.Queries.GetTickets;

internal sealed class GetTicketsQueryHandler(IAppDbContext db, ICurrentUser currentUser)
    : IRequestHandler<GetTicketsQuery, Result<PagedResult<TicketListItem>>>
{
    public async Task<Result<PagedResult<TicketListItem>>> Handle(GetTicketsQuery request, CancellationToken cancellationToken)
    {
        var query = db.Tickets
            .Include(t => t.Requester)
            .Include(t => t.AssignedTo)
            .AsNoTracking()
            .AsQueryable();

        if (currentUser.Role == UserRole.Requester)
            query = query.Where(t => t.RequesterId == currentUser.Id);
        else if (currentUser.Role == UserRole.Agent)
            query = query.Where(t => t.AssignedToId == currentUser.Id);

        if (request.Status.HasValue)
            query = query.Where(t => t.Status == request.Status.Value);

        if (request.Priority.HasValue)
            query = query.Where(t => t.Priority == request.Priority.Value);

        if (request.AssignedToId.HasValue)
            query = query.Where(t => t.AssignedToId == request.AssignedToId.Value);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(t => new TicketListItem(
                t.Id,
                t.Title,
                t.Status.ToString(),
                t.Priority.ToString(),
                t.Requester.FullName,
                t.AssignedTo != null ? t.AssignedTo.FullName : null,
                t.DueDate,
                t.IsSlaBreached,
                t.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<TicketListItem>(items, totalCount, request.Page, request.PageSize);
    }
}
