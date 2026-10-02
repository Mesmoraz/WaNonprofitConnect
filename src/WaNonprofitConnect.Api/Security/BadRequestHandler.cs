using Microsoft.AspNetCore.Mvc;

namespace WaNonprofitConnect.Api.Security;

/// <summary>
/// A request the server refused while reading it (too big, cut off) answers with its own status, 413 or 400,
/// not a 500 (S-114). It's caught before the exception handler, so it isn't logged as a crash ("fail:") either.
/// </summary>
public static class BadRequestHandler
{
    public static IApplicationBuilder UseBadRequestAnswers(this IApplicationBuilder app)
        => app.Use(async (ctx, next) =>
        {
            try { await next(ctx); }
            catch (BadHttpRequestException bad) when (!ctx.Response.HasStarted)
            {
                ctx.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger(typeof(BadRequestHandler))
                    .LogInformation("Refused {Method} {Path}: {Status} {Reason}", ctx.Request.Method, ctx.Request.Path, bad.StatusCode, bad.Message);
                await WriteAsync(ctx, bad);
            }
        });

    public static Task WriteAsync(HttpContext http, BadHttpRequestException bad)
    {
        http.Response.Clear();
        http.Response.StatusCode = bad.StatusCode;
        var title = bad.StatusCode == StatusCodes.Status413PayloadTooLarge ? "That's too much to send at once." : "That didn't come through. Try again.";
        return http.Response.WriteAsJsonAsync(new ProblemDetails { Status = bad.StatusCode, Title = title }, options: null, contentType: "application/problem+json");
    }
}
