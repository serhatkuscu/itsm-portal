using Itsm.Application.Common;
using Itsm.Domain.Enums;
using MediatR;

namespace Itsm.Application.Features.Tickets.Commands.UpdateTicket;

public sealed record UpdateTicketCommand(
    Guid TicketId,
    string Title,
    string Description,
    TicketPriority Priority
) : IRequest<Result>;
