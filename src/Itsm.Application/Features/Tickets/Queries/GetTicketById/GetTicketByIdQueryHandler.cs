using Itsm.Application.Abstractions;
using Itsm.Application.Common;
using Itsm.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Itsm.Application.Features.Tickets.Queries.GetTicketById;

internal sealed class GetTicketByIdQueryHandler(IAppDbContext db, ICurrentUser currentUser)
    : IRequestHandler<GetTicketByIdQuery, Result<TicketDetail>>
{
    public async Task<Result<TicketDetail>> Handle(GetTicketByIdQuery request, CancellationToken cancellationToken)
    {
        var ticket = await db.Tickets
            .Include(t => t.Requester)
            .Include(t => t.AssignedTo)
            .Include(t => t.Comments).ThenInclude(c => c.Author)
            .Include(t => t.AuditLogs)
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == request.TicketId, cancellationToken);

        if (ticket is null)
            return Error.NotFound;

        if (currentUser.Role == UserRole.Requester && ticket.RequesterId != currentUser.Id)
            return Error.Unauthorized;

        var comments = ticket.Comments
            .Where(c => !c.IsInternal || currentUser.Role != UserRole.Requester)
            .Select(c => new CommentDetail(c.Id, c.Author.FullName, c.Content, c.IsInternal, c.CreatedAt))
            .ToList();

        var auditLogs = ticket.AuditLogs
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new AuditDetail(a.Field, a.Action, a.OldValue, a.NewValue, a.CreatedAt))
            .ToList();

        return new TicketDetail(
            ticket.Id, ticket.Title, ticket.Description,
            ticket.Status.ToString(), ticket.Priority.ToString(),
            ticket.Requester.FullName,
            ticket.AssignedTo?.FullName,
            ticket.DueDate, ticket.IsSlaBreached,
            ticket.CreatedAt, ticket.UpdatedAt,
            comments, auditLogs
        );
    }
}
