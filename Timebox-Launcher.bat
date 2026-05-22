@echo off
title Timebox Agenda
:: Intentar abrir con Microsoft Edge en modo aplicación (sin barras de navegación)
where msedge >nul 2>nul
if %errorlevel% equ 0 (
    start msedge --app="%~dp0Timebox-Agenda-Portable.html"
    exit
)

:: Intentar con Google Chrome en modo aplicación
where chrome >nul 2>nul
if %errorlevel% equ 0 (
    start chrome --app="%~dp0Timebox-Agenda-Portable.html"
    exit
)

:: Si no se encuentran los comandos directos, abrir en el navegador predeterminado
start "" "%~dp0Timebox-Agenda-Portable.html"
