using Itsm.Domain.Entities;
using Itsm.Domain.Enums;
using Itsm.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Itsm.Infrastructure.Jobs;

public sealed class SlaMonitoringJob(AppDbContext db, ILogger<SlaMonitoringJob> logger)
{
    public async Task ExecuteAsync()
    {
        var now = DateTime.UtcNow;
        logger.LogInformation("SLA monitoring job started at {Time}", now);

        await ProcessBreachedTickets(now);
        await ProcessApproachingTickets(now);

        logger.LogInformation("SLA monitoring job completed");
    }

    private async Task ProcessBreachedTickets(DateTime now)
    {
        var breachedTickets = await db.Tickets
            .Where(t =>
                !t.IsSlaBreached &&
                t.DueDate < now &&
                t.Status != TicketStatus.Closed &&
                t.Status != TicketStatus.Resolved &&
                t.Status != TicketStatus.Cancelled)
            .ToListAsync();

        foreach (var ticket in breachedTickets)
        {
            ticket.MarkSlaBreached();

            var notification = Notification.Create(
                ticket.RequesterId,
                "SLA Breached",
                $"Ticket '{ticket.Title}' has exceeded its SLA deadline."
            );
            db.Notifications.Add(notification);

            if (ticket.AssignedToId.HasValue)
            {
                var agentNotification = Notification.Create(
                    ticket.AssignedToId.Value,
                    "SLA Breached",
                    $"Ticket #{ticket.Id} '{ticket.Title}' has exceeded its SLA deadline."
                );
                db.Notifications.Add(agentNotification);
            }

            logger.LogWarning("SLA breached for ticket {TicketId}", ticket.Id);
        }

        if (breachedTickets.Count > 0)
            await db.SaveChangesAsync();
    }

    private async Task ProcessApproachingTickets(DateTime now)
    {
        var warningThreshold = now.AddHours(1);

        var approachingTickets = await db.Tickets
            .Where(t =>
                !t.IsSlaBreached &&
                !t.SlaWarningSent &&
                t.DueDate >= now &&
                t.DueDate <= warningThreshold &&
                t.Status != TicketStatus.Closed &&
                t.Status != TicketStatus.Resolved &&
                t.Status != TicketStatus.Cancelled)
            .ToListAsync();

        foreach (var ticket in approachingTickets)
        {
            var minutesLeft = (int)(ticket.DueDate - now).TotalMinutes;

            if (ticket.AssignedToId.HasValue)
            {
                var notification = Notification.Create(
                    ticket.AssignedToId.Value,
                    "SLA Warning",
                    $"Ticket '{ticket.Title}' SLA deadline in {minutesLeft} minutes."
                );
                db.Notifications.Add(notification);
            }

            ticket.MarkSlaWarningSent();

            logger.LogWarning("SLA approaching for ticket {TicketId}, {Minutes} minutes left", ticket.Id, minutesLeft);
        }

        if (approachingTickets.Count > 0)
            await db.SaveChangesAsync();
    }
}
