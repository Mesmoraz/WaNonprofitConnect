using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WaNonprofitConnect.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSchools : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SchoolDistricts",
                columns: table => new
                {
                    LeaCode = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    NameNormalized = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    County = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    City = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Zip5 = table.Column<string>(type: "varchar(5)", unicode: false, maxLength: 5, nullable: true),
                    Latitude = table.Column<double>(type: "float", nullable: true),
                    Longitude = table.Column<double>(type: "float", nullable: true),
                    SchoolCount = table.Column<int>(type: "int", nullable: false),
                    FirstSeenImportRunId = table.Column<int>(type: "int", nullable: false),
                    LastSeenImportRunId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SchoolDistricts", x => x.LeaCode);
                    table.ForeignKey(
                        name: "FK_SchoolDistricts_ImportRuns_FirstSeenImportRunId",
                        column: x => x.FirstSeenImportRunId,
                        principalTable: "ImportRuns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SchoolDistricts_ImportRuns_LastSeenImportRunId",
                        column: x => x.LastSeenImportRunId,
                        principalTable: "ImportRuns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Schools",
                columns: table => new
                {
                    SchoolCode = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    NameNormalized = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    PhysicalAddress = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Street = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    City = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Zip = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: true),
                    Zip5 = table.Column<string>(type: "varchar(5)", unicode: false, maxLength: 5, nullable: true),
                    LeaCode = table.Column<int>(type: "int", nullable: false),
                    LeaName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    SchoolCategory = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    GradeCategory = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    LowestGrade = table.Column<string>(type: "varchar(3)", unicode: false, maxLength: 3, nullable: true),
                    HighestGrade = table.Column<string>(type: "varchar(3)", unicode: false, maxLength: 3, nullable: true),
                    County = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Latitude = table.Column<double>(type: "float", nullable: true),
                    Longitude = table.Column<double>(type: "float", nullable: true),
                    FirstSeenImportRunId = table.Column<int>(type: "int", nullable: false),
                    LastSeenImportRunId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Schools", x => x.SchoolCode);
                    table.ForeignKey(
                        name: "FK_Schools_ImportRuns_FirstSeenImportRunId",
                        column: x => x.FirstSeenImportRunId,
                        principalTable: "ImportRuns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Schools_ImportRuns_LastSeenImportRunId",
                        column: x => x.LastSeenImportRunId,
                        principalTable: "ImportRuns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Schools_SchoolDistricts_LeaCode",
                        column: x => x.LeaCode,
                        principalTable: "SchoolDistricts",
                        principalColumn: "LeaCode",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SchoolDistricts_County",
                table: "SchoolDistricts",
                column: "County");

            migrationBuilder.CreateIndex(
                name: "IX_SchoolDistricts_FirstSeenImportRunId",
                table: "SchoolDistricts",
                column: "FirstSeenImportRunId");

            migrationBuilder.CreateIndex(
                name: "IX_SchoolDistricts_LastSeenImportRunId",
                table: "SchoolDistricts",
                column: "LastSeenImportRunId");

            migrationBuilder.CreateIndex(
                name: "IX_SchoolDistricts_NameNormalized",
                table: "SchoolDistricts",
                column: "NameNormalized");

            migrationBuilder.CreateIndex(
                name: "IX_Schools_City",
                table: "Schools",
                column: "City");

            migrationBuilder.CreateIndex(
                name: "IX_Schools_FirstSeenImportRunId",
                table: "Schools",
                column: "FirstSeenImportRunId");

            migrationBuilder.CreateIndex(
                name: "IX_Schools_GradeCategory",
                table: "Schools",
                column: "GradeCategory");

            migrationBuilder.CreateIndex(
                name: "IX_Schools_LastSeenImportRunId",
                table: "Schools",
                column: "LastSeenImportRunId");

            migrationBuilder.CreateIndex(
                name: "IX_Schools_LeaCode",
                table: "Schools",
                column: "LeaCode");

            migrationBuilder.CreateIndex(
                name: "IX_Schools_NameNormalized",
                table: "Schools",
                column: "NameNormalized");

            migrationBuilder.CreateIndex(
                name: "IX_Schools_Zip5",
                table: "Schools",
                column: "Zip5");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Schools");

            migrationBuilder.DropTable(
                name: "SchoolDistricts");
        }
    }
}
