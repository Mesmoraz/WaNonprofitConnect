namespace WaNonprofitConnect.Api.Security;

/// <summary>
/// Security headers on every response: the API, the built app, the index.html fallback, and error pages (S-114).
/// The policy lists only what the app loads: Google sign-in (script, button frame, its stylesheet), Google Fonts,
/// OpenFreeMap (style JSON, tiles, sprites and glyphs, all fetched), MapLibre's worker (a bundled file) and blob:
/// workers, and the data:/blob: images that MapLibre and "Send feedback" (html-to-image) make.
/// A response that already set its own policy (the feedback screenshot) keeps it.
/// </summary>
public static class SecurityHeaders
{
    public const string Google = "https://accounts.google.com/gsi/";
    public const string OpenFreeMap = "https://tiles.openfreemap.org";

    /// <summary>The policy for a page served from <paramref name="host"/>. SignalR's WebSocket is named for that host only.</summary>
    public static string ContentSecurityPolicy(string host, bool https)
    {
        var socket = https ? $"wss://{host}" : $"ws://{host} wss://{host}"; // behind a TLS proxy the request can look like http
        return string.Join("; ",
            "default-src 'self'",
            $"script-src 'self' {Google}client",
            // React and MapLibre set style attributes; GIS adds its own stylesheet.
            $"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com {Google}style",
            "font-src 'self' https://fonts.gstatic.com",
            $"img-src 'self' data: blob: {OpenFreeMap}",
            $"connect-src 'self' {socket} {OpenFreeMap} {Google}",
            $"frame-src {Google}",
            "worker-src 'self' blob:",
            "child-src 'self' blob:", // older Safari reads workers from child-src
            "manifest-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'");
    }

    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app, bool reportOnly)
    {
        var cspHeader = reportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy";
        return app.Use((ctx, next) =>
        {
            ctx.Response.OnStarting(() =>
            {
                var h = ctx.Response.Headers;
                h["X-Content-Type-Options"] = "nosniff";
                h["Referrer-Policy"] = "strict-origin-when-cross-origin";
                h["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=(), usb=()";
                // Google's sign-in popup talks back to the page that opened it.
                h["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups";
                h["X-Frame-Options"] = "DENY"; // frame-ancestors, for browsers that predate it
                // Swagger UI (Development only) runs inline scripts; it keeps working without a policy.
                if (!ctx.Request.Path.StartsWithSegments("/swagger")
                    && !h.ContainsKey("Content-Security-Policy") && !h.ContainsKey("Content-Security-Policy-Report-Only"))
                    h[cspHeader] = ContentSecurityPolicy(ctx.Request.Host.Value ?? "", ctx.Request.IsHttps);
                return Task.CompletedTask;
            });
            return next(ctx);
        });
    }
}
