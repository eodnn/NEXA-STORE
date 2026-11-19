@echo off
setlocal
cd /d "%~dp0"
title NEXA STORE - Inicializador
color 0B
echo ============================================================
echo                   NEXA STORE - INICIAR
echo ============================================================
where node >nul 2>nul
if errorlevel 1 (
 echo [ERRO] Node.js nao encontrado. Instale Node.js 20+ em https://nodejs.org/
 pause
 exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
 echo [ERRO] npm nao encontrado no PATH.
 pause
 exit /b 1
)
if not exist ".env" (
 echo [ATENCAO] Arquivo .env nao encontrado.
 copy /y ".env.example" ".env" >nul
 echo Edite agora o arquivo .env e configure DB_PASSWORD e JWT_SECRET.
 echo Importe banco.sql no MySQL Workbench antes de continuar.
 echo Depois execute npm run setup para gerar os dados de demonstracao.
 pause
 exit /b 1
)
if not exist "node_modules\express" (
 echo Instalando dependencias do backend...
 call npm install
 if errorlevel 1 goto npm_error
)
if not exist "frontend\dist\index.html" (
 echo Instalando dependencias do frontend...
 call npm --prefix frontend install
 if errorlevel 1 goto npm_error
 echo Compilando interface React...
 call npm run build
 if errorlevel 1 goto npm_error
)
echo.
echo O banco MySQL precisa estar ativo e o .env configurado.
echo Acesse http://localhost:3000 no navegador.
echo Ctrl+C para finalizar o servidor.
echo.
call npm start
pause
exit /b %errorlevel%
:npm_error
echo [ERRO] Falha ao instalar/compilar. Confira internet e versao do Node.js.
pause
exit /b 1
