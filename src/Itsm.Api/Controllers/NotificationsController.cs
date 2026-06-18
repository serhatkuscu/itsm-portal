using Itsm.Application.Abstractions;
using Itsm.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Itsm.Api.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public sealed class NotificationsController(IAppDbContext db, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetMyNotifications(CancellationToken ct)
    {
        var notifications = await db.Notifications
            .Where(n => n.UserId == currentUser.Id)
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .Select(n => new { n.Id, n.Title, n.Message, n.IsRead, n.CreatedAt })
            .ToListAsync(ct);

        return Ok(notifications);
    }

    [HttpPost("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken ct)
    {
        var notification = await db.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == currentUser.Id, ct);

        if (notification is null)
            return NotFound();

        notification.MarkAsRead();
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}
