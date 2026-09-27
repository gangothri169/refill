@echo off
echo ========================================================
echo   RxResolve - AI-Powered Refill Resolution Platform
echo ========================================================
echo.
echo Starting MongoDB daemon on port 27018...
start "RxResolve MongoDB" "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath "c:\refill\data\db" --port 27018 --bind_ip 127.0.0.1
timeout /t 2 /nobreak >nul

echo Starting FastAPI Backend on port 8005...
start "RxResolve Backend" cmd /k "cd /d c:\refill\backend && .\venv\Scripts\activate.bat && python -m uvicorn app.main:app --host 0.0.0.0 --port 8005"
timeout /t 2 /nobreak >nul

echo Starting React Vite Frontend on port 5173...
start "RxResolve Frontend" cmd /k "cd /d c:\refill\frontend && npm run dev"

echo.
echo ========================================================
echo   RxResolve is running!
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:8005
echo   API Docs:  http://localhost:8005/docs
echo ========================================================
pause
