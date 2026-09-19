using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace WaNonprofitConnect.Data;

/// <summary>Lets `dotnet ef` build the context without the API/CLI hosts. Connection string is only used for migration generation.</summary>
public sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public const string DefaultDevConnection =
        @"Server=(localdb)\mssqllocaldb;Database=WaNonprofitConnect_Dev;Trusted_Connection=True;MultipleActiveResultSets=true";

    public AppDbContext CreateDbContext(string[] args)
    {
        var cs = Environment.GetEnvironmentVariable("WANC_CONNECTION") ?? DefaultDevConnection;
        var options = new DbContextOptionsBuilder<AppDbContext>().UseSqlServer(cs).Options;
        return new AppDbContext(options);
    }
}
