using Itsm.Domain.Common;
using Itsm.Domain.Enums;

namespace Itsm.Domain.Entities;

public sealed class User : BaseEntity
{
    public string FirstName { get; private set; } = default!;
    public string LastName { get; private set; } = default!;
    public string Email { get; private set; } = default!;
    public string PasswordHash { get; private set; } = default!;
    public UserRole Role { get; private set; }
    public bool IsActive { get; private set; } = true;

    private readonly List<Ticket> _assignedTickets = [];
    private readonly List<Ticket> _requestedTickets = [];
    private readonly List<RefreshToken> _refreshTokens = [];
    private readonly List<Notification> _notifications = [];

    public IReadOnlyCollection<Ticket> AssignedTickets => _assignedTickets.AsReadOnly();
    public IReadOnlyCollection<Ticket> RequestedTickets => _requestedTickets.AsReadOnly();
    public IReadOnlyCollection<RefreshToken> RefreshTokens => _refreshTokens.AsReadOnly();
    public IReadOnlyCollection<Notification> Notifications => _notifications.AsReadOnly();

    private User() { }

    public static User Create(string firstName, string lastName, string email, string passwordHash, UserRole role)
    {
        return new User
        {
            FirstName = firstName,
            LastName = lastName,
            Email = email.ToLowerInvariant(),
            PasswordHash = passwordHash,
            Role = role
        };
    }

    public string FullName => $"{FirstName} {LastName}";

    public void Deactivate() => IsActive = false;
    public void Activate() => IsActive = true;
    public void ChangeRole(UserRole role) { Role = role; SetUpdated(); }
}
