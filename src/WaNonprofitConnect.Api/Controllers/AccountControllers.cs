using Google.Apis.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaNonprofitConnect.Api.Security;
using WaNonprofitConnect.Data.Accounts;
using WaNonprofitConnect.Data.Exchange;

namespace WaNonprofitConnect.Api.Controllers;

/// <summary>Sign in, sign out, who am I, and joining an organization (invite code or claim).</summary>
[ApiController]
[Route("api/v1")]
[Produces("application/json")]
[Authorize]
public sealed class AccountController : AppControllerBase
{
    private readonly AccountService _accounts;
    private readonly IConfiguration _config;
    private readonly IWebHostEnvironment _env;

    public AccountController(AccountService accounts, IConfiguration config, IWebHostEnvironment env)
    {
        _accounts = accounts;
        _config = config;
        _env = env;
    }

    /// <summary>Exchange a Google ID token (from Google Identity Services in the browser) for the session cookie.</summary>
    [HttpPost("auth/google")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(MeDto), 200)]
    public async Task<ActionResult<MeDto>> Google([FromBody] GoogleSignInRequest request, CancellationToken ct)
    {
        var clientId = _config["Auth:Google:ClientId"];
        if (string.IsNullOrWhiteSpace(clientId))
            return Problem(statusCode: 503, title: "Google sign-in isn't set up on this server yet. Set Auth:Google:ClientId.");
        if (string.IsNullOrWhiteSpace(request.IdToken)) return Problem(statusCode: 400, title: "Sign in with Google first.");

        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken,
                new GoogleJsonWebSignature.ValidationSettings { Audience = new[] { clientId } });
        }
        catch (InvalidJwtException)
        {
            return Problem(statusCode: 401, title: "That Google sign-in didn't work. Try again.");
        }
        if (!payload.EmailVerified) return Problem(statusCode: 401, title: "Google hasn't confirmed that email address yet.");

        var account = await _accounts.SignInAsync(payload.Email, payload.Name, payload.Subject, ct);
        await HttpContext.SignInAccountAsync(account);
        return Ok(await _accounts.GetMeAsync(account.Id, ct));
    }

    /// <summary>Development only: sign in by email. Pass an EIN to be confirmed for it at once.</summary>
    [HttpPost("auth/dev")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(MeDto), 200)]
    public async Task<ActionResult<MeDto>> Dev([FromBody] DevSignInRequest request, CancellationToken ct)
    {
        if (!_env.IsDevelopment()) return NotFound();
        var account = await _accounts.SignInAsync(request.Email, request.Name, null, ct);
        if (!string.IsNullOrWhiteSpace(request.Ein)) await _accounts.ConfirmWithoutInviteAsync(account.Id, request.Ein, ct);
        await HttpContext.SignInAccountAsync(account);
        return Ok(await _accounts.GetMeAsync(account.Id, ct));
    }

    [HttpPost("auth/signout")]
    [AllowAnonymous]
    public async Task<IActionResult> SignOutAccount()
    {
        await HttpContext.SignOutAccountAsync(); // ends the session on the server too, on every device (S-114)
        return NoContent();
    }

    [HttpGet("me")]
    [ProducesResponseType(typeof(MeDto), 200)]
    [ProducesResponseType(401)]
    public async Task<ActionResult<MeDto>> Me(CancellationToken ct)
        => await _accounts.GetMeAsync(AccountId, ct) is { } me ? Ok(me) : Problem(statusCode: 401, title: "Sign in again.");

    /// <summary>Redeem an invite code: confirms you for the code's organization.</summary>
    [HttpPost("invites/redeem")]
    public Task<MeDto> Redeem([FromBody] RedeemInviteRequest request, CancellationToken ct)
        => _accounts.RedeemInviteAsync(AccountId, request.Code, ct);

    /// <summary>Claim an organization. It waits for an admin.</summary>
    [HttpPost("claims")]
    public Task<MeDto> Claim([FromBody] ClaimRequest request, CancellationToken ct)
        => _accounts.ClaimAsync(AccountId, request.Ein, ct);
}

/// <summary>Taylor's page: invite codes and the claims queue. Admins are listed in config <c>Admin:Emails</c>.</summary>
[ApiController]
[Route("api/v1/admin")]
[Produces("application/json")]
[Authorize(Policy = AuthSetup.AdminPolicy)]
public sealed class AdminController : AppControllerBase
{
    private readonly AccountService _accounts;
    public AdminController(AccountService accounts) => _accounts = accounts;

    /// <summary>Pending claims, oldest first. Pass all=true to include decided ones.</summary>
    [HttpGet("claims")]
    public Task<IReadOnlyList<ClaimDto>> Claims([FromQuery] bool all = false, CancellationToken ct = default)
        => _accounts.ListClaimsAsync(pendingOnly: !all, ct);

    [HttpPost("claims/{id:int}/approve")]
    public Task<ClaimDto> Approve(int id, CancellationToken ct) => _accounts.DecideClaimAsync(id, approve: true, Email, ct);

    [HttpPost("claims/{id:int}/reject")]
    public Task<ClaimDto> Reject(int id, CancellationToken ct) => _accounts.DecideClaimAsync(id, approve: false, Email, ct);

    [HttpGet("invites")]
    public Task<IReadOnlyList<InviteDto>> Invites(CancellationToken ct) => _accounts.ListInvitesAsync(ct);

    [HttpPost("invites")]
    public Task<InviteDto> CreateInvite([FromBody] CreateInviteRequest request, CancellationToken ct)
        => _accounts.CreateInviteAsync(request.Ein, request.Uses, Email, ct);

    /// <summary>Admins only: set an organization's board filters for it.</summary>
    [HttpPut("orgs/{ein}/filters")]
    public Task<FiltersDto> SaveOrgFilters(string ein, [FromBody] SaveFiltersRequest request, [FromServices] HelpbookService helpbook, CancellationToken ct)
        => helpbook.SaveFiltersAsync(ein, request.Serve, Email, ct);

    /// <summary>Admins only: act as any organization straight away, no invite. For testing both sides of a thread.</summary>
    [HttpPost("act-as")]
    public async Task<MeDto> ActAs([FromBody] ActAsRequest request, CancellationToken ct)
    {
        await _accounts.ConfirmWithoutInviteAsync(AccountId, request.Ein, ct, code: "ADMIN");
        return (await _accounts.GetMeAsync(AccountId, ct))!;
    }
}

public sealed record ActAsRequest(string Ein);
