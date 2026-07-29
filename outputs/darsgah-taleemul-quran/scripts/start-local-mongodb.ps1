$ErrorActionPreference = "Stop"

Write-Host "Checking MongoDB installation..." -ForegroundColor Cyan

$serverRoot = "C:\Program Files\MongoDB\Server"
if (!(Test-Path $serverRoot)) {
  Write-Host "MongoDB Server folder was not found at: $serverRoot" -ForegroundColor Red
  Write-Host "Install MongoDB Community Server from https://www.mongodb.com/try/download/community"
  exit 1
}

$mongod = Get-ChildItem $serverRoot -Recurse -Filter mongod.exe | Select-Object -First 1
if (!$mongod) {
  Write-Host "mongod.exe was not found inside $serverRoot" -ForegroundColor Red
  Write-Host "Reinstall MongoDB Community Server and choose the MSI installer."
  exit 1
}

$dbPath = "C:\data\db"
if (!(Test-Path $dbPath)) {
  New-Item -ItemType Directory -Path $dbPath -Force | Out-Null
  Write-Host "Created $dbPath"
}

$logPath = Join-Path (Get-Location) "mongodb-local.log"
if (Test-Path $logPath) {
  Remove-Item $logPath -Force
}

Write-Host "Starting MongoDB manually..." -ForegroundColor Green
Write-Host "Keep this PowerShell window open while using the app." -ForegroundColor Yellow
Write-Host "Using: $($mongod.FullName)"
Write-Host "Log: $logPath"

& $mongod.FullName --dbpath $dbPath --bind_ip 127.0.0.1 --port 27017 --logpath $logPath --logappend
