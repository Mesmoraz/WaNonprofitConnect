using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WaNonprofitConnect.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddListingEdits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "EditedAt",
                table: "Listings",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UrgentSince",
                table: "Listings",
                type: "datetime2",
                nullable: true);

            // Urgent needs already posted became urgent when they were posted (Urgency 4 is Critical).
            migrationBuilder.Sql("UPDATE Listings SET UrgentSince = CreatedAt WHERE Kind = 'Need' AND Urgency = 4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EditedAt",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "UrgentSince",
                table: "Listings");
        }
    }
}
