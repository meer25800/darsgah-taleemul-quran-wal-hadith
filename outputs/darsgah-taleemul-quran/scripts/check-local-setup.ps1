$ErrorActionPreference = "Continue"

Write-Host "Node:" -ForegroundColor Cyan
node -v

Write-Host "npm:" -ForegroundColor Cyan
npm -v

Write-Host "MongoDB service:" -ForegroundColor Cyan
Get-Service MongoDB

Write-Host "MongoDB executable:" -ForegroundColor Cyan
Get-ChildItem "C:\Program Files\MongoDB\Server" -Recurse -Filter mongod.exe | Select-Object -First 3 FullName

Write-Host "Project env:" -ForegroundColor Cyan
Get-Content ".\backend\.env"
