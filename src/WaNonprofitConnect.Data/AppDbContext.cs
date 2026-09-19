using Microsoft.EntityFrameworkCore;
using WaNonprofitConnect.Data.Codes;
using WaNonprofitConnect.Data.Entities;

namespace WaNonprofitConnect.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<ImportRun> ImportRuns => Set<ImportRun>();
    public DbSet<NteeCategory> NteeCategories => Set<NteeCategory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Organization>(b =>
        {
            b.HasKey(o => o.Ein);
            b.Property(o => o.Ein).HasMaxLength(9).IsUnicode(false);
            b.Property(o => o.Name).HasMaxLength(200).IsRequired();
            b.Property(o => o.NameNormalized).HasMaxLength(200).IsRequired();
            b.Property(o => o.SortName).HasMaxLength(200);
            b.Property(o => o.InCareOf).HasMaxLength(200);
            b.Property(o => o.Street).HasMaxLength(200);
            b.Property(o => o.City).HasMaxLength(100);
            b.Property(o => o.State).HasMaxLength(2).IsUnicode(false).IsRequired();
            b.Property(o => o.Zip).HasMaxLength(10).IsUnicode(false);
            b.Property(o => o.Zip5).HasMaxLength(5).IsUnicode(false);
            b.Property(o => o.GroupExemption).HasMaxLength(4).IsUnicode(false);
            b.Property(o => o.Subsection).HasMaxLength(2).IsUnicode(false).IsRequired();
            b.Property(o => o.Affiliation).HasMaxLength(1).IsUnicode(false);
            b.Property(o => o.Classification).HasMaxLength(4).IsUnicode(false);
            b.Property(o => o.Deductibility).HasMaxLength(1).IsUnicode(false);
            b.Property(o => o.FoundationCode).HasMaxLength(2).IsUnicode(false);
            b.Property(o => o.Activity).HasMaxLength(9).IsUnicode(false);
            b.Property(o => o.OrganizationCode).HasMaxLength(1).IsUnicode(false);
            b.Property(o => o.Status).HasMaxLength(2).IsUnicode(false);
            b.Property(o => o.AssetCode).HasMaxLength(1).IsUnicode(false);
            b.Property(o => o.IncomeCode).HasMaxLength(1).IsUnicode(false);
            b.Property(o => o.FilingReqCode).HasMaxLength(2).IsUnicode(false);
            b.Property(o => o.PfFilingReqCode).HasMaxLength(1).IsUnicode(false);
            b.Property(o => o.AssetAmount).HasPrecision(18, 2);
            b.Property(o => o.IncomeAmount).HasPrecision(18, 2);
            b.Property(o => o.RevenueAmount).HasPrecision(18, 2);
            b.Property(o => o.NteeCode).HasMaxLength(4).IsUnicode(false);
            b.Property(o => o.NteeMajor).HasMaxLength(1).IsUnicode(false);

            b.HasIndex(o => new { o.State, o.Subsection });
            b.HasIndex(o => o.City);
            b.HasIndex(o => o.Zip5);
            b.HasIndex(o => o.NteeCode);
            b.HasIndex(o => o.NteeMajor);
            b.HasIndex(o => o.NameNormalized);
            b.HasIndex(o => o.Is501c3);

            b.HasOne(o => o.FirstSeenImportRun).WithMany().HasForeignKey(o => o.FirstSeenImportRunId).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(o => o.LastSeenImportRun).WithMany().HasForeignKey(o => o.LastSeenImportRunId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ImportRun>(b =>
        {
            b.Property(r => r.Source).HasConversion<string>().HasMaxLength(20);
            b.Property(r => r.Status).HasConversion<string>().HasMaxLength(20);
            b.Property(r => r.StateFilter).HasMaxLength(2);
            b.Property(r => r.SourceUrl).HasMaxLength(500);
            b.Property(r => r.LocalFilePath).HasMaxLength(500);
            b.Property(r => r.FileSha256).HasMaxLength(64).IsUnicode(false);
            b.HasIndex(r => new { r.Source, r.StartedAt });
        });

        modelBuilder.Entity<NteeCategory>(b =>
        {
            b.HasKey(n => n.Code);
            b.Property(n => n.Code).HasMaxLength(1).IsUnicode(false);
            b.Property(n => n.Name).HasMaxLength(100).IsRequired();
            b.Property(n => n.ProPublicaCategoryName).HasMaxLength(100).IsRequired();
            b.HasData(BmfCodes.NteeMajorGroup.Select(kv => new NteeCategory
            {
                Code = kv.Key,
                Name = kv.Value,
                ProPublicaCategoryId = BmfCodes.ProPublicaCategory[kv.Key].Id,
                ProPublicaCategoryName = BmfCodes.ProPublicaCategory[kv.Key].Name,
            }));
        });
    }
}
