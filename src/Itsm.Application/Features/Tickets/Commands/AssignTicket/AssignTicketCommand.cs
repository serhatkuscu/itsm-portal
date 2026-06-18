using Itsm.Application.Common;
using MediatR;

namespace Itsm.Application.Features.Tickets.Commands.AssignTicket;

public sealed record AssignTicketCommand(Guid TicketId, Guid AgentId) : IRequest<Result>;
