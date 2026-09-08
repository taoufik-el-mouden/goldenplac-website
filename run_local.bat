@echo off
title Goldenplac SL - Servidor Web Local
echo Iniciando servidor local para Goldenplac SL...
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
