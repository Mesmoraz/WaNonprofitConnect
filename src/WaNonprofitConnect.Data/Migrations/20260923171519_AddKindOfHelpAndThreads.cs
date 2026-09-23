using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WaNonprofitConnect.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddKindOfHelpAndThreads : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SenderName",
                table: "Messages",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "NeedSideReadAt",
                table: "Matches",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "OfferSideReadAt",
                table: "Matches",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Cadence",
                table: "Listings",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "OneTime");

            migrationBuilder.AddColumn<string>(
                name: "Help",
                table: "Listings",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Things");

            migrationBuilder.AddColumn<int>(
                name: "Views",
                table: "Listings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Listings_Status_Help",
                table: "Listings",
                columns: new[] { "Status", "Help" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Listings_Status_Help",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "SenderName",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "NeedSideReadAt",
                table: "Matches");

            migrationBuilder.DropColumn(
                name: "OfferSideReadAt",
                table: "Matches");

            migrationBuilder.DropColumn(
                name: "Cadence",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "Help",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "Views",
                table: "Listings");
        }
    }
}
