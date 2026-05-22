@echo off
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 exit /b %errorlevel%

echo Generating Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 exit /b %errorlevel%

echo Starting Development Server...
call npm run dev
