using Itsm.Domain.Common;

namespace Itsm.Domain.Entities;

public sealed class Notification : BaseEntity
{
    public Guid UserId { get; private set; }
    public User User { get; private set; } = default!;

    public string Title { get; private set; } = default!;
    public string Message { get; private set; } = default!;
    public bool IsRead { get; private set; }

    private Notification() { }

    public static Notification Create(Guid userId, string title, string message)
    {
        return new Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            IsRead = false
        };
    }

    public void MarkAsRead()
    {
        IsRead = true;
        SetUpdated();
    }
}
