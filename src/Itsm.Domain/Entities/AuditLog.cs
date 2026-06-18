using Itsm.Domain.Common;

namespace Itsm.Domain.Entities;

public sealed class AuditLog : BaseEntity
{
    public Guid TicketId { get; private set; }
    public Ticket Ticket { get; private set; } = default!;

    public Guid? UserId { get; private set; }
    public string Action { get; private set; } = default!;
    public string? OldValue { get; private set; }
    public string? NewValue { get; private set; }
    public string Field { get; private set; } = default!;

    private AuditLog() { }

    public static AuditLog Create(Guid ticketId, Guid? userId, string field, string action, string? oldValue = null, string? newValue = null)
    {
        return new AuditLog
        {
            TicketId = ticketId,
            UserId = userId,
            Field = field,
            Action = action,
            OldValue = oldValue,
            NewValue = newValue
        };
    }
}
