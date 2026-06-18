using Itsm.Application.Abstractions;
using Itsm.Application.Common;
using Itsm.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Itsm.Application.Features.Auth.Commands.Register;

internal sealed class RegisterCommandHandler(IAppDbContext db, IPasswordHasher passwordHasher)
    : IRequestHandler<RegisterCommand, Result<RegisterResponse>>
{
    public async Task<Result<RegisterResponse>> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var emailExists = await db.Users
            .AnyAsync(u => u.Email == request.Email.ToLowerInvariant(), cancellationToken);

        if (emailExists)
            return Error.Custom("Auth.EmailTaken", "A user with this email already exists.");

        var hash = passwordHasher.Hash(request.Password);
        var user = User.Create(request.FirstName, request.LastName, request.Email, hash, request.Role);

        db.Users.Add(user);
        await db.SaveChangesAsync(cancellationToken);

        return new RegisterResponse(user.Id, user.Email, user.FullName);
    }
}
