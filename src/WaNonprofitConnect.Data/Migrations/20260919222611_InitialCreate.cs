using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace WaNonprofitConnect.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ImportRuns",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Source = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    StateFilter = table.Column<string>(type: "nvarchar(2)", maxLength: 2, nullable: true),
                    SourceUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    LocalFilePath = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    FileSha256 = table.Column<string>(type: "varchar(64)", unicode: false, maxLength: 64, nullable: true),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FinishedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RowsRead = table.Column<int>(type: "int", nullable: false),
                    RowsInserted = table.Column<int>(type: "int", nullable: false),
                    RowsUpdated = table.Column<int>(type: "int", nullable: false),
                    RowsUnchanged = table.Column<int>(type: "int", nullable: false),
                    RowsSkipped = table.Column<int>(type: "int", nullable: false),
                    Errors = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ImportRuns", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "NteeCategories",
                columns: table => new
                {
                    Code = table.Column<string>(type: "varchar(1)", unicode: false, maxLength: 1, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ProPublicaCategoryId = table.Column<int>(type: "int", nullable: false),
                    ProPublicaCategoryName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NteeCategories", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "Organizations",
                columns: table => new
                {
                    Ein = table.Column<string>(type: "varchar(9)", unicode: false, maxLength: 9, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    NameNormalized = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    SortName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    InCareOf = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Street = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    City = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    State = table.Column<string>(type: "varchar(2)", unicode: false, maxLength: 2, nullable: false),
                    Zip = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: true),
                    Zip5 = table.Column<string>(type: "varchar(5)", unicode: false, maxLength: 5, nullable: true),
                    GroupExemption = table.Column<string>(type: "varchar(4)", unicode: false, maxLength: 4, nullable: true),
                    Subsection = table.Column<string>(type: "varchar(2)", unicode: false, maxLength: 2, nullable: false),
                    Affiliation = table.Column<string>(type: "varchar(1)", unicode: false, maxLength: 1, nullable: true),
                    Classification = table.Column<string>(type: "varchar(4)", unicode: false, maxLength: 4, nullable: true),
                    RulingDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Deductibility = table.Column<string>(type: "varchar(1)", unicode: false, maxLength: 1, nullable: true),
                    FoundationCode = table.Column<string>(type: "varchar(2)", unicode: false, maxLength: 2, nullable: true),
                    Activity = table.Column<string>(type: "varchar(9)", unicode: false, maxLength: 9, nullable: true),
                    OrganizationCode = table.Column<string>(type: "varchar(1)", unicode: false, maxLength: 1, nullable: true),
                    Status = table.Column<string>(type: "varchar(2)", unicode: false, maxLength: 2, nullable: true),
                    TaxPeriod = table.Column<DateOnly>(type: "date", nullable: true),
                    AssetCode = table.Column<string>(type: "varchar(1)", unicode: false, maxLength: 1, nullable: true),
                    IncomeCode = table.Column<string>(type: "varchar(1)", unicode: false, maxLength: 1, nullable: true),
                    FilingReqCode = table.Column<string>(type: "varchar(2)", unicode: false, maxLength: 2, nullable: true),
                    PfFilingReqCode = table.Column<string>(type: "varchar(1)", unicode: false, maxLength: 1, nullable: true),
                    AccountingPeriodMonth = table.Column<int>(type: "int", nullable: true),
                    AssetAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    IncomeAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    RevenueAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    NteeCode = table.Column<string>(type: "varchar(4)", unicode: false, maxLength: 4, nullable: true),
                    NteeMajor = table.Column<string>(type: "varchar(1)", unicode: false, maxLength: 1, nullable: true),
                    Is501c3 = table.Column<bool>(type: "bit", nullable: false),
                    FirstSeenImportRunId = table.Column<int>(type: "int", nullable: false),
                    LastSeenImportRunId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Organizations", x => x.Ein);
                    table.ForeignKey(
                        name: "FK_Organizations_ImportRuns_FirstSeenImportRunId",
                        column: x => x.FirstSeenImportRunId,
                        principalTable: "ImportRuns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Organizations_ImportRuns_LastSeenImportRunId",
                        column: x => x.LastSeenImportRunId,
                        principalTable: "ImportRuns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "NteeCategories",
                columns: new[] { "Code", "Name", "ProPublicaCategoryId", "ProPublicaCategoryName" },
                values: new object[,]
                {
                    { "A", "Arts, Culture & Humanities", 1, "Arts, Culture & Humanities" },
                    { "B", "Education", 2, "Education" },
                    { "C", "Environment", 3, "Environment and Animals" },
                    { "D", "Animal-Related", 3, "Environment and Animals" },
                    { "E", "Health Care", 4, "Health" },
                    { "F", "Mental Health & Crisis Intervention", 4, "Health" },
                    { "G", "Voluntary Health Associations & Medical Disciplines", 4, "Health" },
                    { "H", "Medical Research", 4, "Health" },
                    { "I", "Crime & Legal-Related", 5, "Human Services" },
                    { "J", "Employment", 5, "Human Services" },
                    { "K", "Food, Agriculture & Nutrition", 5, "Human Services" },
                    { "L", "Housing & Shelter", 5, "Human Services" },
                    { "M", "Public Safety, Disaster Preparedness & Relief", 5, "Human Services" },
                    { "N", "Recreation & Sports", 5, "Human Services" },
                    { "O", "Youth Development", 5, "Human Services" },
                    { "P", "Human Services", 5, "Human Services" },
                    { "Q", "International, Foreign Affairs & National Security", 6, "International, Foreign Affairs" },
                    { "R", "Civil Rights, Social Action & Advocacy", 7, "Public, Societal Benefit" },
                    { "S", "Community Improvement & Capacity Building", 7, "Public, Societal Benefit" },
                    { "T", "Philanthropy, Voluntarism & Grantmaking Foundations", 7, "Public, Societal Benefit" },
                    { "U", "Science & Technology", 7, "Public, Societal Benefit" },
                    { "V", "Social Science", 7, "Public, Societal Benefit" },
                    { "W", "Public & Societal Benefit", 7, "Public, Societal Benefit" },
                    { "X", "Religion-Related", 8, "Religion Related" },
                    { "Y", "Mutual & Membership Benefit", 9, "Mutual/Membership Benefit" },
                    { "Z", "Unknown", 10, "Unknown, Unclassified" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_ImportRuns_Source_StartedAt",
                table: "ImportRuns",
                columns: new[] { "Source", "StartedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Organizations_City",
                table: "Organizations",
                column: "City");

            migrationBuilder.CreateIndex(
                name: "IX_Organizations_FirstSeenImportRunId",
                table: "Organizations",
                column: "FirstSeenImportRunId");

            migrationBuilder.CreateIndex(
                name: "IX_Organizations_Is501c3",
                table: "Organizations",
                column: "Is501c3");

            migrationBuilder.CreateIndex(
                name: "IX_Organizations_LastSeenImportRunId",
                table: "Organizations",
                column: "LastSeenImportRunId");

            migrationBuilder.CreateIndex(
                name: "IX_Organizations_NameNormalized",
                table: "Organizations",
                column: "NameNormalized");

            migrationBuilder.CreateIndex(
                name: "IX_Organizations_NteeCode",
                table: "Organizations",
                column: "NteeCode");

            migrationBuilder.CreateIndex(
                name: "IX_Organizations_NteeMajor",
                table: "Organizations",
                column: "NteeMajor");

            migrationBuilder.CreateIndex(
                name: "IX_Organizations_State_Subsection",
                table: "Organizations",
                columns: new[] { "State", "Subsection" });

            migrationBuilder.CreateIndex(
                name: "IX_Organizations_Zip5",
                table: "Organizations",
                column: "Zip5");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NteeCategories");

            migrationBuilder.DropTable(
                name: "Organizations");

            migrationBuilder.DropTable(
                name: "ImportRuns");
        }
    }
}
