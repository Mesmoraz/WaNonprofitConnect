using System.Text;

namespace WaNonprofitConnect.Api.Security;

/// <summary>
/// Text from a browser on its way into the server log (S-114). Line breaks become " | " and other control or
/// direction-changing characters a space, so a message can't start a fake log line, and it is cut to a length.
/// </summary>
public static class LogText
{
    public const int DefaultMax = 2_000;

    public static string Clean(string? text, int max = DefaultMax)
    {
        if (string.IsNullOrEmpty(text)) return "";
        var sb = new StringBuilder(Math.Min(text.Length, max) + 4);
        var i = 0;
        for (; i < text.Length && sb.Length < max; i++)
        {
            var c = text[i];
            if (c == '\r' && i + 1 < text.Length && text[i + 1] == '\n') continue; // CRLF is one break
            if (c is '\n' or '\r' or '\u0085' or '\u2028' or '\u2029') sb.Append(" | ");
            else if (char.IsControl(c) || c is '\u200E' or '\u200F' or (>= '\u202A' and <= '\u202E') or (>= '\u2066' and <= '\u2069')) sb.Append(' ');
            else sb.Append(c);
        }
        if (sb.Length > max) sb.Length = max;
        if (i < text.Length) sb.Append('…');
        return sb.ToString();
    }
}
