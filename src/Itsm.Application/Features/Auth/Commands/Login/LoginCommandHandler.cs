using Itsm.Application.Abstractions;
using Itsm.Application.Common;
using Itsm.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Itsm.Application.Features.Auth.Commands.Login;

internal sealed class LoginCommandHandler(
    IAppDbContext db,
    IJwtService jwtService,
    IPasswordHasher passwordHasher)
    : IRequestHandler<LoginCommand, Result<LoginResponse>>
{
    public async Task<Result<LoginResponse>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email.ToLowerInvariant() && u.IsActive, cancellationToken);

        if (user is null || !passwordHasher.Verify(request.Password, user.PasswordHash))
            return Error.Custom("Auth.InvalidCredentials", "Email or password is incorrect.");

        var accessToken = jwtService.GenerateAccessToken(user);
        var rawRefreshToken = jwtService.GenerateRefreshToken();

        await RevokeExistingRefreshTokens(user.Id, cancellationToken);

        var refreshToken = RefreshToken.Create(user.Id, rawRefreshToken);
        db.RefreshTokens.Add(refreshToken);
        await db.SaveChangesAsync(cancellationToken);

        return new LoginResponse(accessToken, rawRefreshToken, user.Email, user.FullName, user.Role.ToString());
    }

    private async Task RevokeExistingRefreshTokens(Guid userId, CancellationToken ct)
    {
        var tokens = await db.RefreshTokens
            .Where(r => r.UserId == userId && !r.IsRevoked)
            .ToListAsync(ct);

        foreach (var token in tokens)
            token.Revoke();
    }
}
