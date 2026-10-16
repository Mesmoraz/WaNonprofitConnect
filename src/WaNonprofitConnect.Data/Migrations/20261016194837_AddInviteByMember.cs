using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WaNonprofitConnect.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddInviteByMember : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ByMember",
                table: "Invites",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ByMember",
                table: "Invites");
        }
    }
}
