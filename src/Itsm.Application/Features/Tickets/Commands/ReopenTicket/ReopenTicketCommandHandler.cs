using Itsm.Application.Abstractions;
using Itsm.Application.Common;
using Itsm.Domain.Entities;
using Itsm.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Itsm.Application.Features.Tickets.Commands.ReopenTicket;

internal sealed class ReopenTicketCommandHandler(IAppDbContext db, ICurrentUser currentUser)
    : IRequestHandler<ReopenTicketCommand, Result>
{
    private static readonly HashSet<TicketStatus> ReopenableStatuses =
        [TicketStatus.Cancelled, TicketStatus.Resolved, TicketStatus.Closed];

    public async Task<Result> Handle(ReopenTicketCommand request, CancellationToken cancellationToken)
    {
        if (currentUser.Role is not (UserRole.Admin or UserRole.Agent))
            return Error.Unauthorized;

        var ticket = await db.Tickets.FirstOrDefaultAsync(t => t.Id == request.TicketId, cancellationToken);
        if (ticket is null)
            return Error.NotFound;

        if (!ReopenableStatuses.Contains(ticket.Status))
            return Error.Custom("Ticket.InvalidTransition", "Only Cancelled, Resolved or Closed tickets can be reopened.");

        var oldStatus = ticket.Status.ToString();
        ticket.ChangeStatus(TicketStatus.Open);

        db.AuditLogs.Add(AuditLog.Create(ticket.Id, currentUser.Id, "Status", "Reopened", oldStatus, TicketStatus.Open.ToString()));

        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
