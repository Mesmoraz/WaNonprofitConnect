## 2026-10-07 · What a database that doesn't pause would cost

**Task:** T-50 (for Taylor's decision T-49). Docs only. Nothing in the app changes.

### What changed

- `docs/OPERATIONS.md` has a new section on database cost. It compares today's free database, which pauses after an idle hour, with three ways to keep it awake, using Azure's own price list for West US 2.
- The short answer: Basic costs about $4.90 a month, never pauses, and fits the data many times over (53 MB of 2 GB). Keeping the free database awake would cost about $175 a month.

### Test cases

1. **[verified]** Prices come from Azure's public price list (prices.azure.com) on Oct 7: Basic $0.161 a day, S0 $0.484 a day, serverless $0.52 per vCore hour.
2. **[verified]** The local database with all Washington organizations uses 53 MB.
3. **[needs you]** Decide T-49. If you choose Basic for production, open the map on your phone after the switch, to check it still loads quickly.
