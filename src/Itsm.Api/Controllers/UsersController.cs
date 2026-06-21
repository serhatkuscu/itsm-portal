using Itsm.Application.Abstractions;
using Itsm.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Itsm.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public sealed class UsersController(IAppDbContext db) : ControllerBase
{
    [HttpGet("agents")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAgents(CancellationToken ct)
    {
        var agents = await db.Users
            .Where(u => u.Role == UserRole.Agent && u.IsActive)
            .OrderBy(u => u.FirstName)
            .Select(u => new AgentDto(u.Id, u.FirstName + " " + u.LastName))
            .ToListAsync(ct);

        return Ok(agents);
    }

    private sealed record AgentDto(Guid Id, string FullName);
}
