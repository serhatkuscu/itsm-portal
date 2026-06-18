using Itsm.Domain.Common;

namespace Itsm.Domain.Entities;

public sealed class RefreshToken : BaseEntity
{
    public string Token { get; private set; } = default!;
    public DateTime ExpiresAt { get; private set; }
    public bool IsRevoked { get; private set; }

    public Guid UserId { get; private set; }
    public User User { get; private set; } = default!;

    private RefreshToken() { }

    public static RefreshToken Create(Guid userId, string token, int expiryDays = 7)
    {
        return new RefreshToken
        {
            UserId = userId,
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddDays(expiryDays)
        };
    }

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsActive => !IsRevoked && !IsExpired;

    public void Revoke()
    {
        IsRevoked = true;
        SetUpdated();
    }
}
