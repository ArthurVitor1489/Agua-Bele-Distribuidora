@echo off
chcp 65001 > nul
title Instalador e Configurador Água Belle — Gestão no Windows
cls

echo ============================================================
echo   💧 INSTALADOR DO SISTEMA ÁGUA BELLE — GESTÃO
echo ============================================================
echo.
echo  [1/4] Verificando ambiente e dependências...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo  ❌ ATENÇÃO: O Node.js não foi encontrado neste computador.
    echo  Para rodar o sistema localmente, baixe e instale o Node.js em:
    echo  👉 https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo  ✅ Node.js detectado com sucesso!
echo.
echo  [2/4] Verificando módulos e banco de dados...
if not exist "%~dp0node_modules\" (
    echo  Instalando pacotes do sistema...
    call npm.cmd install
)

call npx.cmd prisma generate
call npx.cmd prisma db push

echo.
echo  [3/4] Compilando versão de produção de alta velocidade...
call npx.cmd next build

echo.
echo  [4/4] Criando atalhos nativos na Área de Trabalho e Menu Iniciar...
powershell -ExecutionPolicy Bypass -File "%~dp0Criar_Atalhos_Windows.ps1"

echo.
echo ============================================================
echo   ✨ INSTALAÇÃO E COMPILAÇÃO CONCLUÍDAS COM SUCESSO!
echo ============================================================
echo.
echo  O ícone "Água Belle — Gestão" foi adicionado:
echo    1. Na sua Área de Trabalho (Desktop)
echo    2. No seu Menu Iniciar do Windows
echo.
echo  Iniciando o Água Belle pela primeira vez...
echo.

start wscript.exe "%~dp0Iniciar_Agua_Belle.vbs"

pause
