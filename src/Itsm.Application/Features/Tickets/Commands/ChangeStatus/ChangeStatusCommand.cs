using Itsm.Application.Common;
using Itsm.Domain.Enums;
using MediatR;

namespace Itsm.Application.Features.Tickets.Commands.ChangeStatus;

public sealed record ChangeStatusCommand(Guid TicketId, TicketStatus TargetStatus) : IRequest<Result>;
