using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WaNonprofitConnect.Api.Controllers;

/// <summary>
/// Errors from people's browsers (a crashed screen, a script error), written to the server log so we see them
/// without anyone having to report them. Anonymous (the sign-in page can break too), rate limited, and trimmed.
/// Read them with: az webapp log download, then search for "Client error".
/// </summary>
[ApiController]
[Route("api/v1/client-errors")]
[AllowAnonymous]
public sealed class ClientErrorsController(ILogger<ClientErrorsController> logger) : ControllerBase
{
    [HttpPost]
    public IActionResult Report([FromBody] ClientError error)
    {
        static string Cut(string? s, int max) => string.IsNullOrEmpty(s) ? "" : s.Length <= max ? s : s[..max] + "…";
        logger.LogWarning("Client error ({Kind}) on {Url}: {Message}\n{Stack}\nBuild {Build} · {UserAgent}",
            Cut(error.Kind, 40), Cut(error.Url, 300), Cut(error.Message, 500), Cut(error.Stack, 3000),
            Cut(error.Build, 60), Cut(Request.Headers.UserAgent.ToString(), 200));
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
