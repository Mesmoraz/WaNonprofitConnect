# Show recent errors from the live site: browser errors people hit, and server errors.
#   powershell -File scripts/errors.ps1            (last 2 days)
#   powershell -File scripts/errors.ps1 -Days 7
# Needs the Azure CLI signed in (az login). Reads App Service's container logs; nothing is changed.
param([int]$Days = 2)
$ErrorActionPreference = 'Stop'
$az = "$env:LOCALAPPDATA\Programs\AzureCLI\bin\az.cmd"
$dir = Join-Path $env:TEMP 'helpbook-logs'; $zip = "$dir.zip"
if (Test-Path $dir) { Remove-Item -Recurse -Force $dir }
& $az webapp log download -g helpbook-alpha -n helpbook-alpha --log-file $zip -o none
# Not Expand-Archive: it fails on the paths inside App Service's log bundle.
New-Item -ItemType Directory -Force $dir | Out-Null
tar.exe -xf $zip -C $dir 2>$null
$since = (Get-Date).ToUniversalTime().AddDays(-$Days)
$files = Get-ChildItem $dir -Recurse -Include *docker.log, *failure.log | Where-Object { $_.LastWriteTimeUtc -ge $since }
$pattern = 'Client error|fail: |Unhandled exception|An unhandled exception|Error Number:|ContainerStartupFailure'
foreach ($f in $files) {
  $hits = Select-String -Path $f.FullName -Pattern $pattern -Context 0, 3
  if ($hits) { "== $($f.Name)"; $hits | ForEach-Object { $_.Line; $_.Context.PostContext } }
}
"Done. Full logs: $dir"
