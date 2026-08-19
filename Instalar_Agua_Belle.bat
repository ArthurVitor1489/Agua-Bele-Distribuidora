@echo off
chcp 65001 > nul
title Instalador Água Belle — Gestão no Windows
cls

echo ============================================================
echo   💧 INSTALADOR DO SISTEMA ÁGUA BELLE — GESTÃO
echo ============================================================
echo.
echo  Criando atalhos nativos na Área de Trabalho e Menu Iniciar...
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0Criar_Atalhos_Windows.ps1"

echo.
echo ============================================================
echo   ✨ INSTALAÇÃO CONCLUÍDA COM SUCESSO!
echo ============================================================
echo.
echo  O ícone "Água Belle — Gestão" foi adicionado:
echo    1. Na sua Área de Trabalho (Desktop)
echo    2. No seu Menu Iniciar do Windows
echo.
echo  Você já pode dar 2 cliques no ícone para abrir o programa em
echo  uma janela nativa de aplicativo no Windows!
echo.
pause
