Write-Host "Configuring Windows Firewall for IPFS Storage App LAN Access..." -ForegroundColor Cyan

# Check for Administrator privileges
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "=====================================================" -ForegroundColor Red
    Write-Host "ERROR: Please run this script as an Administrator." -ForegroundColor Red
    Write-Host "Right-click 'allow_lan_access.ps1' and select 'Run with PowerShell'," -ForegroundColor Yellow
    Write-Host "Or open an Admin PowerShell and run: .\allow_lan_access.ps1" -ForegroundColor Yellow
    Write-Host "=====================================================" -ForegroundColor Red
    Pause
    Exit
}

Write-Host "Adding Inbound Rule for React Frontend (Port 3000)..."
New-NetFirewallRule -DisplayName "IPFS App Frontend (Port 3000)" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -Profile Any -ErrorAction SilentlyContinue

Write-Host "Adding Inbound Rule for Node Backend (Port 5002)..."
New-NetFirewallRule -DisplayName "IPFS App Backend (Port 5002)" -Direction Inbound -LocalPort 5002 -Protocol TCP -Action Allow -Profile Any -ErrorAction SilentlyContinue

Write-Host "Firewall rules successfully added!" -ForegroundColor Green
Write-Host "Your mobile device should now be able to scan the QR code and connect properly." -ForegroundColor Yellow
Pause
