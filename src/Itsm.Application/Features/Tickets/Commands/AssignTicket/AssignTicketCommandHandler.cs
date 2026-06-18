using Itsm.Application.Abstractions;
using Itsm.Application.Common;
using Itsm.Domain.Entities;
using Itsm.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Itsm.Application.Features.Tickets.Commands.AssignTicket;

internal sealed class AssignTicketCommandHandler(IAppDbContext db, ICurrentUser currentUser)
    : IRequestHandler<AssignTicketCommand, Result>
{
    public async Task<Result> Handle(AssignTicketCommand request, CancellationToken cancellationToken)
    {
        if (currentUser.Role is not (UserRole.Admin or UserRole.Agent))
            return Error.Unauthorized;

        var ticket = await db.Tickets.FirstOrDefaultAsync(t => t.Id == request.TicketId, cancellationToken);
        if (ticket is null)
            return Error.NotFound;

        var agentExists = await db.Users.AnyAsync(
            u => u.Id == request.AgentId && u.Role == UserRole.Agent && u.IsActive,
            cancellationToken);

        if (!agentExists)
            return Error.Custom("Agent.NotFound", "Agent not found or is inactive.");

        var previousAgentId = ticket.AssignedToId?.ToString() ?? "Unassigned";
        ticket.Assign(request.AgentId);

        var auditLog = AuditLog.Create(ticket.Id, currentUser.Id, "AssignedTo", "Assigned", previousAgentId, request.AgentId.ToString());
        db.AuditLogs.Add(auditLog);

        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
