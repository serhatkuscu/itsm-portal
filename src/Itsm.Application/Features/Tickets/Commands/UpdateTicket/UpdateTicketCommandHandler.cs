using Itsm.Application.Abstractions;
using Itsm.Application.Common;
using Itsm.Domain.Entities;
using Itsm.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Itsm.Application.Features.Tickets.Commands.UpdateTicket;

internal sealed class UpdateTicketCommandHandler(IAppDbContext db, ICurrentUser currentUser)
    : IRequestHandler<UpdateTicketCommand, Result>
{
    public async Task<Result> Handle(UpdateTicketCommand request, CancellationToken cancellationToken)
    {
        var ticket = await db.Tickets.FirstOrDefaultAsync(t => t.Id == request.TicketId, cancellationToken);

        if (ticket is null)
            return Error.NotFound;

        if (ticket.IsClosed())
            return Error.Custom("Ticket.Closed", "Closed or cancelled tickets cannot be updated.");

        if (currentUser.Role == UserRole.Requester && ticket.RequesterId != currentUser.Id)
            return Error.Unauthorized;

        var oldPriority = ticket.Priority.ToString();
        ticket.UpdateDetails(request.Title, request.Description, request.Priority);

        var auditLog = AuditLog.Create(ticket.Id, currentUser.Id, "Priority", "Updated", oldPriority, ticket.Priority.ToString());
        db.AuditLogs.Add(auditLog);

        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
