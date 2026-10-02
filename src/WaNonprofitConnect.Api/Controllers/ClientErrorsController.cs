using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaNonprofitConnect.Api.Security;

namespace WaNonprofitConnect.Api.Controllers;

/// <summary>
/// Errors from people's browsers (a crashed screen, a script error), written to the server log so we see them
/// without anyone having to report them. Anonymous (the sign-in page can break too), rate limited, and trimmed.
/// Every field stays on one log line: line breaks and control characters are replaced (S-114), and the body is
/// at most 16 KB (413 above that).
/// Read them with: az webapp log download, then search for "Client error".
/// </summary>
[ApiController]
[Route("api/v1/client-errors")]
[AllowAnonymous]
public sealed class ClientErrorsController(ILogger<ClientErrorsController> logger) : ControllerBase
{
    public const int MaxBodyBytes = 16 * 1024;

    [HttpPost]
    [RequestSizeLimit(MaxBodyBytes)]
    public IActionResult Report([FromBody] ClientError error)
    {
        logger.LogWarning("Client error ({Kind}) on {Url}: {Message} | {Stack} | Build {Build} · {UserAgent}",
            LogText.Clean(error.Kind, 40), LogText.Clean(error.Url, 300), LogText.Clean(error.Message, 500), LogText.Clean(error.Stack),
            LogText.Clean(error.Build, 60), LogText.Clean(Request.Headers.UserAgent.ToString(), 200));
        return NoContent();
    }
}

public sealed class ClientError
{
    public string? Kind { get; set; }
    public string? Message { get; set; }
    public string? Stack { get; set; }
    public string? Url { get; set; }
    public string? Build { get; set; }
}
