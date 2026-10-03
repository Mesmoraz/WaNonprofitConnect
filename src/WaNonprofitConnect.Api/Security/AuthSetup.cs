using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using WaNonprofitConnect.Data.Accounts;
using WaNonprofitConnect.Data.Entities;
using WaNonprofitConnect.Data.Exchange;

namespace WaNonprofitConnect.Api.Security;

public static class AuthSetup
{
    public const string CookieName = "helpbook";
    public const string AdminPolicy = "Admin";
    /// <summary>The claim holding the account's session number when the cookie was made (see Account.SessionVersion).</summary>
    public const string SessionVersionClaim = "sv";
    private static readonly TimeSpan SessionCheckCache = TimeSpan.FromMinutes(1);

    /// <summary>
    /// First-party cookie auth. The app, API and hub share one origin, so SameSite=Lax is enough and no CORS credentials are needed.
    /// API callers get 401/403, never a redirect to a login page.
    /// </summary>
    public static IServiceCollection AddHelpbookAuth(this IServiceCollection services, IConfiguration config, IHostEnvironment env)
    {
        var accountOptions = new AccountOptions
        {
            // Either a list (Admin__Emails__0, __1) or one comma-separated value (Admin__Emails), as App Service settings allow.
            AdminEmails = (config.GetSection("Admin:Emails").Get<string[]>() ?? Array.Empty<string>())
                .Append(config["Admin:Emails"] ?? "")
                .SelectMany(e => e.Split(',', ';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                .Where(e => !string.IsNullOrWhiteSpace(e)).Distinct(StringComparer.OrdinalIgnoreCase).ToArray(),
        };
        services.AddSingleton(accountOptions);

        services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
            .AddCookie(o =>
            {
                o.Cookie.Name = CookieName;
                o.Cookie.HttpOnly = true;
                o.Cookie.SameSite = SameSiteMode.Lax;
                o.Cookie.SecurePolicy = env.IsDevelopment() ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
                o.ExpireTimeSpan = TimeSpan.FromDays(30);
                o.SlidingExpiration = true;
                o.Events.OnValidatePrincipal = ValidateSessionAsync;
                o.Events.OnRedirectToLogin = ctx => WriteProblem(ctx.HttpContext, 401, "Sign in first.");
                o.Events.OnRedirectToAccessDenied = ctx => WriteProblem(ctx.HttpContext, 403, "That page is for admins.");
            });

        services.AddAuthorization(o => o.AddPolicy(AdminPolicy, p => p
            .RequireAuthenticatedUser()
            .RequireAssertion(ctx => accountOptions.IsAdmin(ctx.User.FindFirstValue(ClaimTypes.Email)))));
        return services;
    }

    /// <summary>
    /// A cookie made before the account's last sign-out is turned away (S-114). The number is read from the database
    /// at most once a minute per account; signing out on this server clears that at once.
    /// Cookies from before this check carry no number and count as 0.
    /// </summary>
    private static async Task ValidateSessionAsync(CookieValidatePrincipalContext ctx)
    {
        if (ctx.Principal?.AccountId() is not { } accountId) { ctx.RejectPrincipal(); return; }
        var services = ctx.HttpContext.RequestServices;
        var cache = services.GetRequiredService<IMemoryCache>();
        var current = await cache.GetOrCreateAsync(SessionCacheKey(accountId), entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = SessionCheckCache;
            return services.GetRequiredService<AccountService>().SessionVersionAsync(accountId, ctx.HttpContext.RequestAborted);
        });
        var claimed = int.TryParse(ctx.Principal.FindFirstValue(SessionVersionClaim), out var v) ? v : 0;
        if (current is null || current != claimed)
        {
            ctx.RejectPrincipal();
            await ctx.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        }
    }

    private static string SessionCacheKey(Guid accountId) => $"session-version:{accountId}";

    /// <summary>Sign out here and end every session the account has, so a copied cookie stops working too.</summary>
    public static async Task SignOutAccountAsync(this HttpContext http)
    {
        if (http.User.AccountId() is { } accountId)
        {
            await http.RequestServices.GetRequiredService<AccountService>().EndSessionsAsync(accountId, http.RequestAborted);
            http.RequestServices.GetRequiredService<IMemoryCache>().Remove(SessionCacheKey(accountId));
        }
        await http.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    }

    public static Task SignInAccountAsync(this HttpContext http, Account account)
    {
        var identity = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, account.Id.ToString()),
            new Claim(ClaimTypes.Email, account.Email),
            new Claim(ClaimTypes.Name, account.Name),
            new Claim(SessionVersionClaim, account.SessionVersion.ToString(System.Globalization.CultureInfo.InvariantCulture)),
        }, CookieAuthenticationDefaults.AuthenticationScheme);
        return http.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(identity),
            new AuthenticationProperties { IsPersistent = true });
    }

    public static Guid? AccountId(this ClaimsPrincipal user)
        => Guid.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    public static Guid RequireAccountId(this ClaimsPrincipal user)
        => user.AccountId() ?? throw new ExchangeException(401, "Sign in first.");

    private static Task WriteProblem(HttpContext http, int status, string title)
    {
        http.Response.StatusCode = status;
        return http.Response.WriteAsJsonAsync(new ProblemDetails { Status = status, Title = title }, options: null, contentType: "application/problem+json");
    }
}
