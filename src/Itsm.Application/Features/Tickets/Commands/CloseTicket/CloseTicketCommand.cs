using Itsm.Application.Common;
using Itsm.Domain.Enums;
using MediatR;

namespace Itsm.Application.Features.Tickets.Commands.CloseTicket;

public sealed record CloseTicketCommand(Guid TicketId, TicketStatus TargetStatus) : IRequest<Result>;
