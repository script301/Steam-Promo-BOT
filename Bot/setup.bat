@echo off
echo Verificando Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js não encontrado. Por favor, instale o Node.js manualmente antes de continuar.
    exit /b 1
)

echo Instalando dependências npm...
npm install discord.js node-fetch dotenv

echo Pronto! Agora configure seu arquivo .env e rode o bot com:
echo node index.js
pause