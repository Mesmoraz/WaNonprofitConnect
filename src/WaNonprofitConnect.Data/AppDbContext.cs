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
    public DbSet<Listing> Listings => Set<Listing>();
    public DbSet<Match> Matches => Set<Match>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<School> Schools => Set<School>();
    public DbSet<SchoolDistrict> SchoolDistricts => Set<SchoolDistrict>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Membership> Memberships => Set<Membership>();
    public DbSet<Invite> Invites => Set<Invite>();
    public DbSet<ZipCentroid> ZipCentroids => Set<ZipCentroid>();

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

        modelBuilder.Entity<Listing>(b =>
        {
            b.Property(l => l.Kind).HasConversion<string>().HasMaxLength(10);
            b.Property(l => l.Category).HasConversion<string>().HasMaxLength(20);
            b.Property(l => l.Help).HasConversion<string>().HasMaxLength(20).HasDefaultValue(KindOfHelp.Things).HasSentinel((KindOfHelp)0);
            b.Property(l => l.Cadence).HasConversion<string>().HasMaxLength(10).HasDefaultValue(Cadence.OneTime).HasSentinel((Cadence)0);
            // Urgency stays numeric so ORDER BY ranks Critical > High > Normal > Low.
            b.Property(l => l.Status).HasConversion<string>().HasMaxLength(10);
            b.Property(l => l.OrgEin).HasMaxLength(9).IsUnicode(false).IsRequired();
            b.Property(l => l.Title).HasMaxLength(200).IsRequired();
            b.Property(l => l.Description).HasMaxLength(4000);
            b.Property(l => l.Unit).HasMaxLength(40);
            b.Property(l => l.Tags).HasMaxLength(500);
            b.Property(l => l.SearchText).HasMaxLength(2000).IsRequired();
            b.Property(l => l.Quantity).HasPrecision(18, 2);
            b.Property(l => l.City).HasMaxLength(100);
            b.Property(l => l.Zip5).HasMaxLength(5).IsUnicode(false);
            b.HasOne(l => l.Org).WithMany().HasForeignKey(l => l.OrgEin).OnDelete(DeleteBehavior.Restrict);
            b.HasIndex(l => new { l.Kind, l.Status, l.Category });
            b.HasIndex(l => new { l.Status, l.Help });
            b.HasIndex(l => l.OrgEin);
            b.HasIndex(l => l.City);
        });

        modelBuilder.Entity<Match>(b =>
        {
            b.Property(m => m.Status).HasConversion<string>().HasMaxLength(10);
            b.Property(m => m.ProposedByEin).HasMaxLength(9).IsUnicode(false).IsRequired();
            b.Property(m => m.Note).HasMaxLength(2000);
            b.HasOne(m => m.NeedListing).WithMany(l => l.MatchesAsNeed).HasForeignKey(m => m.NeedListingId).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(m => m.OfferListing).WithMany(l => l.MatchesAsOffer).HasForeignKey(m => m.OfferListingId).OnDelete(DeleteBehavior.Restrict);
            b.HasIndex(m => new { m.NeedListingId, m.OfferListingId }).IsUnique();
        });

        modelBuilder.Entity<Message>(b =>
        {
            b.Property(m => m.SenderEin).HasMaxLength(9).IsUnicode(false).IsRequired();
            b.Property(m => m.Body).HasMaxLength(4000).IsRequired();
            b.Property(m => m.SenderName).HasMaxLength(200);
            b.HasOne(m => m.Match).WithMany(x => x.Messages).HasForeignKey(m => m.MatchId).OnDelete(DeleteBehavior.Cascade);
            b.HasIndex(m => new { m.MatchId, m.SentAt });
        });

        modelBuilder.Entity<ZipCentroid>(b =>
        {
            b.HasKey(z => z.Zip5);
            b.Property(z => z.Zip5).HasMaxLength(5).IsUnicode(false);
        });

        modelBuilder.Entity<Account>(b =>
        {
            b.Property(a => a.Email).HasMaxLength(320).IsRequired();
            b.Property(a => a.Name).HasMaxLength(200).IsRequired();
            b.Property(a => a.GoogleSubject).HasMaxLength(100).IsUnicode(false);
            b.HasIndex(a => a.Email).IsUnique();
            b.HasIndex(a => a.GoogleSubject);
        });

        modelBuilder.Entity<Membership>(b =>
        {
            b.Property(m => m.Ein).HasMaxLength(9).IsUnicode(false).IsRequired();
            b.Property(m => m.Status).HasConversion<string>().HasMaxLength(10);
            b.Property(m => m.Via).HasConversion<string>().HasMaxLength(10);
            b.Property(m => m.InviteCode).HasMaxLength(8).IsUnicode(false);
            b.Property(m => m.DecidedBy).HasMaxLength(320);
            b.HasOne(m => m.Account).WithOne(a => a.Membership).HasForeignKey<Membership>(m => m.AccountId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(m => m.Org).WithMany().HasForeignKey(m => m.Ein).OnDelete(DeleteBehavior.Restrict);
            b.HasIndex(m => m.AccountId).IsUnique(); // one membership per account in the alpha
            b.HasIndex(m => new { m.Ein, m.Status });
        });

        modelBuilder.Entity<Invite>(b =>
        {
            b.HasKey(i => i.Code);
            b.Property(i => i.Code).HasMaxLength(8).IsUnicode(false);
            b.Property(i => i.Ein).HasMaxLength(9).IsUnicode(false).IsRequired();
            b.Property(i => i.CreatedBy).HasMaxLength(320).IsRequired();
            b.HasOne(i => i.Org).WithMany().HasForeignKey(i => i.Ein).OnDelete(DeleteBehavior.Restrict);
            b.HasIndex(i => i.Ein);
        });

        modelBuilder.Entity<SchoolDistrict>(b =>
        {
            b.HasKey(d => d.LeaCode);
            b.Property(d => d.LeaCode).ValueGeneratedNever();
            b.Property(d => d.Name).HasMaxLength(200).IsRequired();
            b.Property(d => d.NameNormalized).HasMaxLength(200).IsRequired();
            b.Property(d => d.County).HasMaxLength(50);
            b.Property(d => d.City).HasMaxLength(100);
            b.Property(d => d.Zip5).HasMaxLength(5).IsUnicode(false);

            b.HasIndex(d => d.NameNormalized);
            b.HasIndex(d => d.County);

            b.HasOne(d => d.FirstSeenImportRun).WithMany().HasForeignKey(d => d.FirstSeenImportRunId).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(d => d.LastSeenImportRun).WithMany().HasForeignKey(d => d.LastSeenImportRunId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<School>(b =>
        {
            b.HasKey(s => s.SchoolCode);
            b.Property(s => s.SchoolCode).ValueGeneratedNever();
            b.Property(s => s.Name).HasMaxLength(200).IsRequired();
            b.Property(s => s.NameNormalized).HasMaxLength(200).IsRequired();
            b.Property(s => s.PhysicalAddress).HasMaxLength(200);
            b.Property(s => s.Street).HasMaxLength(200);
            b.Property(s => s.City).HasMaxLength(100);
            b.Property(s => s.Zip).HasMaxLength(10).IsUnicode(false);
            b.Property(s => s.Zip5).HasMaxLength(5).IsUnicode(false);
            b.Property(s => s.LeaName).HasMaxLength(200).IsRequired();
            b.Property(s => s.SchoolCategory).HasMaxLength(200);
            b.Property(s => s.GradeCategory).HasMaxLength(50);
            b.Property(s => s.LowestGrade).HasMaxLength(3).IsUnicode(false);
            b.Property(s => s.HighestGrade).HasMaxLength(3).IsUnicode(false);
            b.Property(s => s.County).HasMaxLength(50);

            b.HasIndex(s => s.LeaCode);
            b.HasIndex(s => s.City);
            b.HasIndex(s => s.Zip5);
            b.HasIndex(s => s.GradeCategory);
            b.HasIndex(s => s.NameNormalized);

            b.HasOne(s => s.District).WithMany(d => d.Schools).HasForeignKey(s => s.LeaCode).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(s => s.FirstSeenImportRun).WithMany().HasForeignKey(s => s.FirstSeenImportRunId).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(s => s.LastSeenImportRun).WithMany().HasForeignKey(s => s.LastSeenImportRunId).OnDelete(DeleteBehavior.Restrict);
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
