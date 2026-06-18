using Itsm.Application.Common;
using MediatR;

namespace Itsm.Application.Features.Auth.Commands.Login;

public sealed record LoginCommand(string Email, string Password) : IRequest<Result<LoginResponse>>;

public sealed record LoginResponse(
    string AccessToken,
    string RefreshToken,
    string Email,
    string FullName,
    string Role
);
