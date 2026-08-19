# Script PowerShell para criar os Atalhos no Windows

$DesktopPath = [System.Environment]::GetFolderPath('Desktop')
$StartMenuPath = Join-Path ([System.Environment]::GetFolderPath('StartMenu')) "Programs"
$ProjectDir = Get-Location

$ShortcutPathDesktop = Join-Path $DesktopPath "Agua Belle - Gestao.lnk"
$ShortcutPathStartMenu = Join-Path $StartMenuPath "Agua Belle - Gestao.lnk"
$VbsPath = Join-Path $ProjectDir "Iniciar_Agua_Belle.vbs"

$WScriptShell = New-Object -ComObject WScript.Shell

# 1. Atalho na Area de Trabalho
$ShortcutDesktop = $WScriptShell.CreateShortcut($ShortcutPathDesktop)
$ShortcutDesktop.TargetPath = "wscript.exe"
$ShortcutDesktop.Arguments = "`"$VbsPath`""
$ShortcutDesktop.WorkingDirectory = "$ProjectDir"
$ShortcutDesktop.Description = "Sistema de Gestao Agua Belle"
$ShortcutDesktop.IconLocation = "$ProjectDir\public\favicon.ico, 0"
$ShortcutDesktop.Save()

# 2. Atalho no Menu Iniciar
$ShortcutStartMenu = $WScriptShell.CreateShortcut($ShortcutPathStartMenu)
$ShortcutStartMenu.TargetPath = "wscript.exe"
$ShortcutStartMenu.Arguments = "`"$VbsPath`""
$ShortcutStartMenu.WorkingDirectory = "$ProjectDir"
$ShortcutStartMenu.Description = "Sistema de Gestao Agua Belle"
$ShortcutStartMenu.IconLocation = "$ProjectDir\public\favicon.ico, 0"
$ShortcutStartMenu.Save()

Write-Host "Atalhos do Agua Belle instalados com sucesso no Windows!" -ForegroundColor Green
