using Itsm.Domain.Common;
using Itsm.Domain.Enums;

namespace Itsm.Domain.Entities;

public sealed class Ticket : BaseEntity
{
    public string Title { get; private set; } = default!;
    public string Description { get; private set; } = default!;
    public TicketStatus Status { get; private set; }
    public TicketPriority Priority { get; private set; }
    public DateTime DueDate { get; private set; }
    public bool IsSlaBreached { get; private set; }
    public DateTime? ResolvedAt { get; private set; }
    public DateTime? ClosedAt { get; private set; }

    public Guid RequesterId { get; private set; }
    public User Requester { get; private set; } = default!;

    public Guid? AssignedToId { get; private set; }
    public User? AssignedTo { get; private set; }

    private readonly List<TicketComment> _comments = [];
    private readonly List<AuditLog> _auditLogs = [];

    public IReadOnlyCollection<TicketComment> Comments => _comments.AsReadOnly();
    public IReadOnlyCollection<AuditLog> AuditLogs => _auditLogs.AsReadOnly();

    private Ticket() { }

    public static Ticket Create(string title, string description, TicketPriority priority, Guid requesterId)
    {
        var ticket = new Ticket
        {
            Title = title,
            Description = description,
            Priority = priority,
            Status = TicketStatus.Open,
            RequesterId = requesterId,
            DueDate = CalculateDueDate(priority)
        };
        return ticket;
    }

    public void Assign(Guid agentId)
    {
        AssignedToId = agentId;
        Status = TicketStatus.InProgress;
        SetUpdated();
    }

    public void UpdateDetails(string title, string description, TicketPriority priority)
    {
        Title = title;
        Description = description;

        if (Priority != priority)
        {
            Priority = priority;
            DueDate = CalculateDueDate(priority);
        }

        SetUpdated();
    }

    public void ChangeStatus(TicketStatus newStatus)
    {
        Status = newStatus;

        if (newStatus == TicketStatus.Resolved)
            ResolvedAt = DateTime.UtcNow;

        if (newStatus == TicketStatus.Closed)
            ClosedAt = DateTime.UtcNow;

        SetUpdated();
    }

    public void MarkSlaBreached()
    {
        IsSlaBreached = true;
        SetUpdated();
    }

    public bool IsClosed() => Status is TicketStatus.Closed or TicketStatus.Cancelled;

    private static DateTime CalculateDueDate(TicketPriority priority)
    {
        var hours = priority switch
        {
            TicketPriority.Critical => 2,
            TicketPriority.High => 8,
            TicketPriority.Medium => 24,
            TicketPriority.Low => 72,
            _ => 24
        };
        return DateTime.UtcNow.AddHours(hours);
    }
}
