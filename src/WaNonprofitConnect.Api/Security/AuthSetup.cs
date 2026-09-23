using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using WaNonprofitConnect.Data.Accounts;
using WaNonprofitConnect.Data.Entities;
using WaNonprofitConnect.Data.Exchange;

namespace WaNonprofitConnect.Api.Security;

public static class AuthSetup
{
    public const string CookieName = "helpbook";
    public const string AdminPolicy = "Admin";

    /// <summary>
    /// First-party cookie auth. The app, API and hub share one origin, so SameSite=Lax is enough and no CORS credentials are needed.
    /// API callers get 401/403, never a redirect to a login page.
    /// </summary>
    public static IServiceCollection AddHelpbookAuth(this IServiceCollection services, IConfiguration config, IHostEnvironment env)
    {
        var accountOptions = new AccountOptions
        {
            AdminEmails = config.GetSection("Admin:Emails").Get<string[]>()?.Where(e => !string.IsNullOrWhiteSpace(e)).ToArray() ?? Array.Empty<string>(),
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
                o.Events.OnRedirectToLogin = ctx => WriteProblem(ctx.HttpContext, 401, "Sign in first.");
                o.Events.OnRedirectToAccessDenied = ctx => WriteProblem(ctx.HttpContext, 403, "That page is for admins.");
            });

        services.AddAuthorization(o => o.AddPolicy(AdminPolicy, p => p
            .RequireAuthenticatedUser()
            .RequireAssertion(ctx => accountOptions.IsAdmin(ctx.User.FindFirstValue(ClaimTypes.Email)))));
        return services;
    }

    public static Task SignInAccountAsync(this HttpContext http, Account account)
    {
        var identity = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, account.Id.ToString()),
            new Claim(ClaimTypes.Email, account.Email),
            new Claim(ClaimTypes.Name, account.Name),
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
