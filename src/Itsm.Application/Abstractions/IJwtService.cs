using Itsm.Domain.Entities;

namespace Itsm.Application.Abstractions;

public interface IJwtService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
}
