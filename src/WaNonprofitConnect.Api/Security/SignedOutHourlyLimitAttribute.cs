namespace WaNonprofitConnect.Api.Security;

/// <summary>
/// Signed out, this endpoint takes only a few requests an hour from one address (RateLimit:SignedOutPerHour, 5 by
/// default), on top of the usual per-minute limit. Signed in, only the usual limit applies. See Program.cs (S-114).
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public sealed class SignedOutHourlyLimitAttribute : Attribute;
