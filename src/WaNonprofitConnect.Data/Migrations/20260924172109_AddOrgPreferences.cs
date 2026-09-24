using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WaNonprofitConnect.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddOrgPreferences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "OrgPreferences",
                columns: table => new
                {
                    Ein = table.Column<string>(type: "varchar(9)", unicode: false, maxLength: 9, nullable: false),
                    Serve = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedBy = table.Column<string>(type: "nvarchar(320)", maxLength: 320, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrgPreferences", x => x.Ein);
                    table.ForeignKey(
                        name: "FK_OrgPreferences_Organizations_Ein",
                        column: x => x.Ein,
                        principalTable: "Organizations",
                        principalColumn: "Ein",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OrgPreferences");
        }
    }
}
