using Itsm.Application.Abstractions;
using Itsm.Application.Common;
using Itsm.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Itsm.Application.Features.Tickets.Commands.CreateTicket;

internal sealed class CreateTicketCommandHandler(IAppDbContext db, ICurrentUser currentUser)
    : IRequestHandler<CreateTicketCommand, Result<CreateTicketResponse>>
{
    public async Task<Result<CreateTicketResponse>> Handle(CreateTicketCommand request, CancellationToken cancellationToken)
    {
        var requesterExists = await db.Users.AnyAsync(u => u.Id == currentUser.Id, cancellationToken);
        if (!requesterExists)
            return Error.NotFound;

        var ticket = Ticket.Create(request.Title, request.Description, request.Priority, currentUser.Id);
        db.Tickets.Add(ticket);

        var auditLog = AuditLog.Create(ticket.Id, currentUser.Id, "Status", "Created", null, "Open");
        db.AuditLogs.Add(auditLog);

        await db.SaveChangesAsync(cancellationToken);

        return new CreateTicketResponse(ticket.Id, ticket.Title, ticket.DueDate);
    }
}
