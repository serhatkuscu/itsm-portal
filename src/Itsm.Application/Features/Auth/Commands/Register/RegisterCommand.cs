using Itsm.Application.Common;
using Itsm.Domain.Enums;
using MediatR;

namespace Itsm.Application.Features.Auth.Commands.Register;

public sealed record RegisterCommand(
    string FirstName,
    string LastName,
    string Email,
    string Password,
    UserRole Role = UserRole.Requester
) : IRequest<Result<RegisterResponse>>;

public sealed record RegisterResponse(Guid UserId, string Email, string FullName);
