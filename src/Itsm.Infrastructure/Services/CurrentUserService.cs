using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Itsm.Application.Abstractions;
using Itsm.Domain.Enums;
using Microsoft.AspNetCore.Http;

namespace Itsm.Infrastructure.Services;

internal sealed class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    private readonly ClaimsPrincipal? _user = httpContextAccessor.HttpContext?.User;

    public Guid Id
    {
        get
        {
            var sub = _user?.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? _user?.FindFirstValue("sub");
            return Guid.TryParse(sub, out var id) ? id : Guid.Empty;
        }
    }

    public string Email =>
        _user?.FindFirstValue(ClaimTypes.Email)
        ?? _user?.FindFirstValue(JwtRegisteredClaimNames.Email)
        ?? _user?.FindFirstValue("email")
        ?? string.Empty;

    public UserRole Role
    {
        get
        {
            var role = _user?.FindFirstValue(ClaimTypes.Role);
            return Enum.TryParse<UserRole>(role, out var userRole) ? userRole : UserRole.Requester;
        }
    }

    public bool IsAuthenticated => _user?.Identity?.IsAuthenticated ?? false;
}
