using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WaNonprofitConnect.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddZipCentroids : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ZipCentroids",
                columns: table => new
                {
                    Zip5 = table.Column<string>(type: "varchar(5)", unicode: false, maxLength: 5, nullable: false),
                    Lat = table.Column<double>(type: "float", nullable: false),
                    Lon = table.Column<double>(type: "float", nullable: false),
                    LastSeenImportRunId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZipCentroids", x => x.Zip5);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ZipCentroids");
        }
    }
}
