# IPFS Storage App Startup Script

Write-Host "Starting IPFS Storage App Services..." -ForegroundColor Cyan

# Cleanup existing processes
Write-Host "Cleaning up existing processes..." -ForegroundColor Gray
Stop-Process -Name "ipfs" -ErrorAction SilentlyContinue
Stop-Process -Name "node" -ErrorAction SilentlyContinue

# 1. Start IPFS Daemon
Write-Host "Starting IPFS Daemon in a new window..." -ForegroundColor Yellow
Start-Process -FilePath ".\kubo\ipfs.exe" -ArgumentList "daemon" 
Start-Sleep -Seconds 5

# 2. Start Backend Server
Write-Host "Starting Backend Server in a new window..." -ForegroundColor Yellow
Start-Process -FilePath "node" -ArgumentList "server.js"
Start-Sleep -Seconds 2

# 3. Start Frontend App
Write-Host "Starting Frontend App in a new window..." -ForegroundColor Yellow
Start-Process -FilePath "npm.cmd" -ArgumentList "start"

Write-Host "All services started in separate windows!" -ForegroundColor Green
Write-Host "You can now see the logs for each component in their respective windows."
Write-Host "Backend: http://localhost:5000"
Write-Host "Frontend: http://localhost:3000"
Write-Host "IPFS API: http://127.0.0.1:5001"
