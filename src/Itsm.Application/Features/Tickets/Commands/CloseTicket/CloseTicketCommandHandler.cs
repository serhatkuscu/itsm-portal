using Itsm.Application.Abstractions;
using Itsm.Application.Common;
using Itsm.Domain.Entities;
using Itsm.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Itsm.Application.Features.Tickets.Commands.CloseTicket;

internal sealed class CloseTicketCommandHandler(IAppDbContext db, ICurrentUser currentUser)
    : IRequestHandler<CloseTicketCommand, Result>
{
    private static readonly HashSet<TicketStatus> TerminalStatuses = [TicketStatus.Closed, TicketStatus.Cancelled];

    public async Task<Result> Handle(CloseTicketCommand request, CancellationToken cancellationToken)
    {
        if (!TerminalStatuses.Contains(request.TargetStatus))
            return Error.Custom("Ticket.InvalidStatus", "Only Closed or Cancelled are valid terminal statuses.");

        var ticket = await db.Tickets.FirstOrDefaultAsync(t => t.Id == request.TicketId, cancellationToken);
        if (ticket is null)
            return Error.NotFound;

        if (ticket.IsClosed())
            return Error.Custom("Ticket.AlreadyClosed", "Ticket is already in a terminal state.");

        if (request.TargetStatus == TicketStatus.Cancelled)
        {
            if (currentUser.Role == UserRole.Requester)
                return Error.Unauthorized;
            if (ticket.Status == TicketStatus.Resolved)
                return Error.Custom("Ticket.InvalidTransition", "Cannot cancel a resolved ticket. Close it instead.");
        }

        if (request.TargetStatus == TicketStatus.Closed
            && currentUser.Role == UserRole.Requester
            && ticket.RequesterId != currentUser.Id)
            return Error.Unauthorized;

        var oldStatus = ticket.Status.ToString();
        ticket.ChangeStatus(request.TargetStatus);

        var auditLog = AuditLog.Create(ticket.Id, currentUser.Id, "Status", "StatusChanged", oldStatus, request.TargetStatus.ToString());
        db.AuditLogs.Add(auditLog);

        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
