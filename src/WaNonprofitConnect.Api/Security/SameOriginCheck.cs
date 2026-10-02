using Microsoft.AspNetCore.Mvc;

namespace WaNonprofitConnect.Api.Security;

/// <summary>
/// Defense in depth for the session cookie (S-114). A POST, PUT, PATCH or DELETE under /api from another site's page
/// is refused, even where SameSite=Lax would already keep the cookie off it. The browser says where a request came
/// from (Origin, Sec-Fetch-Site). Callers that send neither (the CLI, scripts, tests) are let through: they hold
/// their own cookie, so there's nothing to forge.
/// </summary>
public static class SameOriginCheck
{
    public static IApplicationBuilder UseSameOriginCheck(this IApplicationBuilder app, IEnumerable<string> trustedOrigins)
    {
        var trusted = trustedOrigins.Select(Authority).Where(a => a is not null).ToHashSet(StringComparer.OrdinalIgnoreCase);
        return app.Use(async (ctx, next) =>
        {
            if (IsUnsafe(ctx.Request.Method) && ctx.Request.Path.StartsWithSegments("/api") && !Allowed(ctx.Request, trusted))
            {
                ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
                await ctx.Response.WriteAsJsonAsync(new ProblemDetails { Status = 403, Title = "That came from another site, so we stopped it." },
                    options: null, contentType: "application/problem+json");
                return;
            }
            await next(ctx);
        });
    }

    internal static bool Allowed(HttpRequest request, IReadOnlySet<string?> trusted)
    {
        var origin = request.Headers.Origin.ToString();
        if (origin.Length > 0)
        {
            var authority = Authority(origin);
            if (authority is null) return false; // "null" (a sandboxed frame, a file) or garbage
            return string.Equals(authority, request.Host.Value, StringComparison.OrdinalIgnoreCase) || trusted.Contains(authority);
        }
        // No Origin: an older browser, or not a browser. Sec-Fetch-Site still tells on another site's page.
        var site = request.Headers["Sec-Fetch-Site"].ToString();
        return site is not ("cross-site" or "same-site");
    }

    private static bool IsUnsafe(string method)
        => !(HttpMethods.IsGet(method) || HttpMethods.IsHead(method) || HttpMethods.IsOptions(method) || HttpMethods.IsTrace(method));

    /// <summary>"https://host:port" to "host:port" (default ports left off, as in the Host header). Null if it isn't a web origin.</summary>
    private static string? Authority(string origin)
        => Uri.TryCreate(origin, UriKind.Absolute, out var u) && (u.Scheme == Uri.UriSchemeHttp || u.Scheme == Uri.UriSchemeHttps) ? u.Authority : null;
}
