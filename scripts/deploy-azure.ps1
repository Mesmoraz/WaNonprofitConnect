# Build the app and the API on this machine, then deploy both to an Azure App Service in one zip.
# Normally GitHub does this (.github/workflows): every merge to main goes to staging, and production is
# the "Deploy to production" button. This script is the fallback, and it goes to staging unless told otherwise.
#   powershell -File scripts/deploy-azure.ps1                       # staging
#   powershell -File scripts/deploy-azure.ps1 -App helpbook-alpha   # production
param([ValidateSet('helpbook-staging', 'helpbook-alpha')][string]$App = 'helpbook-staging')
# The Google client id is public; it comes from app/.env.production at build time.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$az = "$env:LOCALAPPDATA\Programs\AzureCLI\bin\az.cmd"
$rg = 'helpbook-alpha'; $app = $App
$out = Join-Path $env:TEMP 'helpbook-publish'; $zip = "$out.zip"

Push-Location "$root\app"; npm run build; if ($LASTEXITCODE) { throw 'app build failed' }; Pop-Location
if (Test-Path $out) { Remove-Item -Recurse -Force $out }
dotnet publish "$root\src\WaNonprofitConnect.Api" -c Release -o $out; if ($LASTEXITCODE) { throw 'publish failed' }
if (Test-Path $zip) { Remove-Item -Force $zip }
# Not Compress-Archive: PowerShell 5.1 writes backslashes into zip paths, which Linux App Service rejects.
tar.exe -a -c -f $zip -C $out @((Get-ChildItem $out).Name); if ($LASTEXITCODE) { throw 'zip failed' }
& $az webapp deploy -g $rg -n $app --src-path $zip --type zip --async false
$code = (Invoke-WebRequest "https://$app.azurewebsites.net/health" -UseBasicParsing).StatusCode
Write-Output "health: $code"
