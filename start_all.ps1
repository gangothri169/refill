Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  RxResolve - AI-Powered Refill Resolution Platform" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

Write-Host "Starting MongoDB on port 27018..." -ForegroundColor Yellow
Start-Process "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" -ArgumentList '--dbpath "c:\refill\data\db" --port 27018 --bind_ip 127.0.0.1' -WindowStyle Minimized
Start-Sleep -Seconds 2

Write-Host "Starting FastAPI Backend on port 8005..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd c:\refill\backend; .\venv\Scripts\Activate.ps1; python -m uvicorn app.main:app --host 0.0.0.0 --port 8005'
Start-Sleep -Seconds 2

Write-Host "Starting React Frontend on port 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd c:\refill\frontend; npm run dev'

Write-Host "`nRxResolve is live!" -ForegroundColor Green
Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "  Backend:   http://localhost:8005" -ForegroundColor White
Write-Host "  API Docs:  http://localhost:8005/docs" -ForegroundColor White
