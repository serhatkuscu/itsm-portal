using Itsm.Application.Common;
using Itsm.Domain.Enums;
using MediatR;

namespace Itsm.Application.Features.Tickets.Queries.GetTickets;

public sealed record GetTicketsQuery(
    TicketStatus? Status = null,
    TicketPriority? Priority = null,
    Guid? AssignedToId = null,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<TicketListItem>>>;

public sealed record TicketListItem(
    Guid Id,
    string Title,
    string Status,
    string Priority,
    string RequesterName,
    string? AssignedToName,
    DateTime DueDate,
    bool IsSlaBreached,
    DateTime CreatedAt
);

public sealed record PagedResult<T>(IReadOnlyList<T> Items, int TotalCount, int Page, int PageSize)
{
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}
