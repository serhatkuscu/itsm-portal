using Itsm.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Itsm.Infrastructure.Persistence.Configurations;

internal sealed class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Action).HasMaxLength(100).IsRequired();
        builder.Property(a => a.Field).HasMaxLength(100).IsRequired();
        builder.Property(a => a.OldValue).HasMaxLength(500);
        builder.Property(a => a.NewValue).HasMaxLength(500);
        builder.HasIndex(a => a.TicketId);
    }
}
