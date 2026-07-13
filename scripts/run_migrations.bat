@echo off
rem ------------------------------------------------------------
rem Supabase migration script for Anandam Wellness Dashboard
rem ------------------------------------------------------------

:: Ensure Supabase CLI is installed
where supabase >nul 2>&1
if %errorlevel% neq 0 (
  echo Supabase CLI not found. Please install it first: https://supabase.com/docs/guides/cli
  exit /b 1
)

rem Navigate to project root (adjust if needed)
cd /d "%~dp0..\.."

rem Apply migrations to the local Supabase project
supabase db push

if %errorlevel% neq 0 (
  echo Migration failed. Check the output above for errors.
  exit /b %errorlevel%
) else (
  echo Migrations applied successfully.
)
