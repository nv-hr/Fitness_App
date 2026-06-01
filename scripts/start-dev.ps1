param(
  [switch]$NoBrowser
)

$Root = Split-Path -Parent $PSScriptRoot
$BackendDir = Join-Path $Root "backend"
$FrontendDir = Join-Path $Root "frontend"

Write-Host "Starting Fitness_App development servers..." -ForegroundColor Cyan
Write-Host ""

# Start backend
Write-Host "Starting backend (port 3001)..." -ForegroundColor Green
$backendJob = Start-Job -ScriptBlock {
  param($dir)
  Set-Location $dir
  npm run dev
} -ArgumentList $BackendDir

# Wait for backend to be ready
$backendReady = $false
for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Seconds 1
  try {
    $res = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    if ($res.StatusCode -eq 200) {
      $backendReady = $true
      break
    }
  } catch {}
}
if ($backendReady) {
  Write-Host "  -> Backend ready at http://localhost:3001" -ForegroundColor Green
} else {
  Write-Host "  -> Backend started (check http://localhost:3001)" -ForegroundColor Yellow
}

# Start frontend
Write-Host "Starting frontend (port 5173)..." -ForegroundColor Green
$frontendJob = Start-Job -ScriptBlock {
  param($dir)
  Set-Location $dir
  npm run dev
} -ArgumentList $FrontendDir

# Wait for frontend to be ready
Start-Sleep -Seconds 5
$frontendReady = $false
for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Seconds 1
  try {
    $res = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    if ($res.StatusCode -eq 200) {
      $frontendReady = $true
      break
    }
  } catch {}
}
if ($frontendReady) {
  Write-Host "  -> Frontend ready at http://localhost:5173" -ForegroundColor Green
} else {
  Write-Host "  -> Frontend started (check http://localhost:5173)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers." -ForegroundColor Gray
Write-Host "Run: Get-Job | Stop-Job | Remove-Job  (to clean up after Ctrl+C)" -ForegroundColor Gray

if (-not $NoBrowser) {
  Start-Process "http://localhost:5173"
}

# Keep script alive
while ($true) {
  Start-Sleep -Seconds 10
  $backendRunning = $backendJob.State -eq 'Running'
  $frontendRunning = $frontendJob.State -eq 'Running'
  if (-not $backendRunning -or -not $frontendRunning) {
    Write-Host "A server stopped unexpectedly. Cleaning up..." -ForegroundColor Red
    Get-Job | Stop-Job | Remove-Job
    break
  }
}
