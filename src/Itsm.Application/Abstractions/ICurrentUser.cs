using Itsm.Domain.Enums;

namespace Itsm.Application.Abstractions;

public interface ICurrentUser
{
    Guid Id { get; }
    string Email { get; }
    UserRole Role { get; }
    bool IsAuthenticated { get; }
}
