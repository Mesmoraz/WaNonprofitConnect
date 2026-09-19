using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WaNonprofitConnect.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddExchange : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Listings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Kind = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    OrgEin = table.Column<string>(type: "varchar(9)", unicode: false, maxLength: 9, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    Quantity = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    Unit = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: true),
                    Urgency = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Tags = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    SearchText = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    City = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Zip5 = table.Column<string>(type: "varchar(5)", unicode: false, maxLength: 5, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Listings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Listings_Organizations_OrgEin",
                        column: x => x.OrgEin,
                        principalTable: "Organizations",
                        principalColumn: "Ein",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Matches",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NeedListingId = table.Column<int>(type: "int", nullable: false),
                    OfferListingId = table.Column<int>(type: "int", nullable: false),
                    ProposedByEin = table.Column<string>(type: "varchar(9)", unicode: false, maxLength: 9, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Note = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Score = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RespondedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Matches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Matches_Listings_NeedListingId",
                        column: x => x.NeedListingId,
                        principalTable: "Listings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Matches_Listings_OfferListingId",
                        column: x => x.OfferListingId,
                        principalTable: "Listings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Messages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MatchId = table.Column<int>(type: "int", nullable: false),
                    SenderEin = table.Column<string>(type: "varchar(9)", unicode: false, maxLength: 9, nullable: false),
                    Body = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    SentAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Messages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Messages_Matches_MatchId",
                        column: x => x.MatchId,
                        principalTable: "Matches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Listings_City",
                table: "Listings",
                column: "City");

            migrationBuilder.CreateIndex(
                name: "IX_Listings_Kind_Status_Category",
                table: "Listings",
                columns: new[] { "Kind", "Status", "Category" });

            migrationBuilder.CreateIndex(
                name: "IX_Listings_OrgEin",
                table: "Listings",
                column: "OrgEin");

            migrationBuilder.CreateIndex(
                name: "IX_Matches_NeedListingId_OfferListingId",
                table: "Matches",
                columns: new[] { "NeedListingId", "OfferListingId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Matches_OfferListingId",
                table: "Matches",
                column: "OfferListingId");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_MatchId_SentAt",
                table: "Messages",
                columns: new[] { "MatchId", "SentAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Messages");

            migrationBuilder.DropTable(
                name: "Matches");

            migrationBuilder.DropTable(
                name: "Listings");
        }
    }
}
