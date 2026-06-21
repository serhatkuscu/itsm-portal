using Itsm.Application.Common;
using MediatR;

namespace Itsm.Application.Features.Tickets.Commands.ReopenTicket;

public sealed record ReopenTicketCommand(Guid TicketId) : IRequest<Result>;
