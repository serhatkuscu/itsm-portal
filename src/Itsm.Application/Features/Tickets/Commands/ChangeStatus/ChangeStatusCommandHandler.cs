using Itsm.Application.Abstractions;
using Itsm.Application.Common;
using Itsm.Domain.Entities;
using Itsm.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Itsm.Application.Features.Tickets.Commands.ChangeStatus;

internal sealed class ChangeStatusCommandHandler(IAppDbContext db, ICurrentUser currentUser)
    : IRequestHandler<ChangeStatusCommand, Result>
{
    private static readonly HashSet<TicketStatus> AllowedStatuses =
        [TicketStatus.InProgress, TicketStatus.WaitingCustomer, TicketStatus.Resolved];

    public async Task<Result> Handle(ChangeStatusCommand request, CancellationToken cancellationToken)
    {
        if (!AllowedStatuses.Contains(request.TargetStatus))
            return Error.Custom("Ticket.InvalidStatus", "Only InProgress, WaitingCustomer or Resolved are allowed here. Use /close for terminal statuses.");

        if (currentUser.Role is not (UserRole.Admin or UserRole.Agent))
            return Error.Unauthorized;

        var ticket = await db.Tickets.FirstOrDefaultAsync(t => t.Id == request.TicketId, cancellationToken);
        if (ticket is null)
            return Error.NotFound;

        if (ticket.IsClosed())
            return Error.Custom("Ticket.Closed", "Cannot change status of a closed or cancelled ticket.");

        var oldStatus = ticket.Status.ToString();
        ticket.ChangeStatus(request.TargetStatus);

        var auditLog = AuditLog.Create(ticket.Id, currentUser.Id, "Status", "StatusChanged", oldStatus, request.TargetStatus.ToString());
        db.AuditLogs.Add(auditLog);

        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
