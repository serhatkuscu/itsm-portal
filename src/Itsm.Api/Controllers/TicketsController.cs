using Itsm.Application.Features.Tickets.Commands.AssignTicket;
using Itsm.Application.Features.Tickets.Commands.CloseTicket;
using Itsm.Application.Features.Tickets.Commands.CreateTicket;
using Itsm.Application.Features.Tickets.Commands.UpdateTicket;
using Itsm.Application.Features.Tickets.Queries.GetTicketById;
using Itsm.Application.Features.Tickets.Queries.GetTickets;
using Itsm.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Itsm.Api.Controllers;

[ApiController]
[Route("api/tickets")]
[Authorize]
public sealed class TicketsController(ISender sender) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<TicketListItem>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTickets(
        [FromQuery] TicketStatus? status,
        [FromQuery] TicketPriority? priority,
        [FromQuery] Guid? assignedToId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await sender.Send(new GetTicketsQuery(status, priority, assignedToId, page, pageSize), ct);
        return Ok(result.Value);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(TicketDetail), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTicket(Guid id, CancellationToken ct)
    {
        var result = await sender.Send(new GetTicketByIdQuery(id), ct);

        return result.IsSuccess
            ? Ok(result.Value)
            : NotFound(new ProblemDetails { Title = result.Error.Code, Detail = result.Error.Message });
    }

    [HttpPost]
    [ProducesResponseType(typeof(CreateTicketResponse), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateTicket([FromBody] CreateTicketCommand command, CancellationToken ct)
    {
        var result = await sender.Send(command, ct);

        return result.IsSuccess
            ? CreatedAtAction(nameof(GetTicket), new { id = result.Value!.TicketId }, result.Value)
            : BadRequest(new ProblemDetails { Title = result.Error.Code, Detail = result.Error.Message });
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateTicket(Guid id, [FromBody] UpdateTicketRequest request, CancellationToken ct)
    {
        var command = new UpdateTicketCommand(id, request.Title, request.Description, request.Priority);
        var result = await sender.Send(command, ct);

        return result.IsSuccess
            ? NoContent()
            : BadRequest(new ProblemDetails { Title = result.Error.Code, Detail = result.Error.Message });
    }

    [HttpPost("{id:guid}/assign")]
    [Authorize(Roles = "Admin,Agent")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> AssignTicket(Guid id, [FromBody] AssignTicketRequest request, CancellationToken ct)
    {
        var result = await sender.Send(new AssignTicketCommand(id, request.AgentId), ct);

        return result.IsSuccess
            ? NoContent()
            : BadRequest(new ProblemDetails { Title = result.Error.Code, Detail = result.Error.Message });
    }

    [HttpPost("{id:guid}/close")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> CloseTicket(Guid id, [FromBody] CloseTicketRequest request, CancellationToken ct)
    {
        var result = await sender.Send(new CloseTicketCommand(id, request.Status), ct);

        return result.IsSuccess
            ? NoContent()
            : BadRequest(new ProblemDetails { Title = result.Error.Code, Detail = result.Error.Message });
    }
}

public sealed record UpdateTicketRequest(string Title, string Description, TicketPriority Priority);
public sealed record AssignTicketRequest(Guid AgentId);
public sealed record CloseTicketRequest(TicketStatus Status);
