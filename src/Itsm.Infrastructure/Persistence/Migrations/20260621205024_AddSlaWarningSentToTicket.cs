using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Itsm.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSlaWarningSentToTicket : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "SlaWarningSent",
                table: "Tickets",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SlaWarningSent",
                table: "Tickets");
        }
    }
}
