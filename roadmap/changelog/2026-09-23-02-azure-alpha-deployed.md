## 2026-09-23 · Azure alpha deployed

**Story:** S-75.

### What changed

- The React app, API, SignalR hub, and Azure SQL database are live at [helpbook-alpha.azurewebsites.net](https://helpbook-alpha.azurewebsites.net).
- The app connects to SQL with its managed identity. The temporary firewall access from Taylor’s computer has been removed.
- Google sign-in still needs the OAuth client ID before people can sign in.

### Why

Taylor upgraded the Azure account and asked to finish the backend setup.

### Test cases

1. **[needs your phone]** Open `https://helpbook-alpha.azurewebsites.net`. → The sign-up page loads over HTTPS.
2. **[needs your phone]** Open `https://helpbook-alpha.azurewebsites.net/signup` directly. → The sign-up page loads after a refresh.
