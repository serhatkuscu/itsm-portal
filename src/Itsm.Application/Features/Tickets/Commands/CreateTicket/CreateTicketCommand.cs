using Itsm.Application.Common;
using Itsm.Domain.Enums;
using MediatR;

namespace Itsm.Application.Features.Tickets.Commands.CreateTicket;

public sealed record CreateTicketCommand(
    string Title,
    string Description,
    TicketPriority Priority
) : IRequest<Result<CreateTicketResponse>>;

public sealed record CreateTicketResponse(Guid TicketId, string Title, DateTime DueDate);
