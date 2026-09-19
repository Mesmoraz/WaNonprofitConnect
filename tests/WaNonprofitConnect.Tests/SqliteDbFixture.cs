using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using WaNonprofitConnect.Data;

namespace WaNonprofitConnect.Tests;

/// <summary>A fresh in-memory SQLite database per test. The connection must stay open or the DB disappears.</summary>
public sealed class SqliteDbFixture : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly DbContextOptions<AppDbContext> _options;

    public SqliteDbFixture()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();
        _options = new DbContextOptionsBuilder<AppDbContext>().UseSqlite(_connection).Options;
        using var db = CreateContext();
        db.Database.EnsureCreated();
    }

    public AppDbContext CreateContext() => new(_options);

    public void Dispose() => _connection.Dispose();
}
