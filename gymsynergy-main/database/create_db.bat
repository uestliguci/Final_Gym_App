@echo off
echo Creating gym database...
set PGPASSWORD=1234

REM Try common PostgreSQL installation paths
if exist "C:\Program Files\PostgreSQL\15\bin\psql.exe" (
    "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -h localhost -p 5432 -f create_db.sql
) else if exist "C:\Program Files\PostgreSQL\14\bin\psql.exe" (
    "C:\Program Files\PostgreSQL\14\bin\psql.exe" -U postgres -h localhost -p 5432 -f create_db.sql
) else if exist "C:\Program Files\PostgreSQL\13\bin\psql.exe" (
    "C:\Program Files\PostgreSQL\13\bin\psql.exe" -U postgres -h localhost -p 5432 -f create_db.sql
) else (
    echo PostgreSQL installation not found in common locations.
    echo Please ensure PostgreSQL is installed and add it to your system PATH
    echo or modify this script with the correct path to your psql.exe
)

if %ERRORLEVEL% EQU 0 (
    echo Database created successfully!
) else (
    echo Error creating database.
)
pause
