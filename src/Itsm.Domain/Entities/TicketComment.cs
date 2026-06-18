using Itsm.Domain.Common;

namespace Itsm.Domain.Entities;

public sealed class TicketComment : BaseEntity
{
    public string Content { get; private set; } = default!;
    public bool IsInternal { get; private set; }

    public Guid TicketId { get; private set; }
    public Ticket Ticket { get; private set; } = default!;

    public Guid AuthorId { get; private set; }
    public User Author { get; private set; } = default!;

    private TicketComment() { }

    public static TicketComment Create(Guid ticketId, Guid authorId, string content, bool isInternal = false)
    {
        return new TicketComment
        {
            TicketId = ticketId,
            AuthorId = authorId,
            Content = content,
            IsInternal = isInternal
        };
    }
}
