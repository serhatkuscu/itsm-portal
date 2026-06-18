using Itsm.Application.Common;
using MediatR;

namespace Itsm.Application.Features.Tickets.Queries.GetTicketById;

public sealed record GetTicketByIdQuery(Guid TicketId) : IRequest<Result<TicketDetail>>;

public sealed record TicketDetail(
    Guid Id,
    string Title,
    string Description,
    string Status,
    string Priority,
    string RequesterName,
    string? AssignedToName,
    DateTime DueDate,
    bool IsSlaBreached,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    IReadOnlyList<CommentDetail> Comments,
    IReadOnlyList<AuditDetail> AuditLogs
);

public sealed record CommentDetail(Guid Id, string AuthorName, string Content, bool IsInternal, DateTime CreatedAt);
public sealed record AuditDetail(string Field, string Action, string? OldValue, string? NewValue, DateTime CreatedAt);
