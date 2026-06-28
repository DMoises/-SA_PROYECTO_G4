<#
.SYNOPSIS
    Ejecuta las pruebas de carga ligera con Locust contra Quetxal TV y genera
    un reporte HTML con los resultados (Fase 3, Tarea 15).

.DESCRIPTION
    Lanza Locust en modo headless contra el entorno indicado, inyectando tráfico
    sobre las rutas críticas definidas en locustfile.py. Al terminar deja:
        reports/quetxal-<entorno>-<timestamp>.html   (reporte visual)
        reports/quetxal-<entorno>-<timestamp>_*.csv  (datos crudos)

.PARAMETER Environment
    develop (default) | release | una URL completa (http://host).

.PARAMETER Users
    Número máximo de usuarios concurrentes (default 200).

.PARAMETER SpawnRate
    Usuarios nuevos por segundo durante la rampa (default 20).

.PARAMETER RunTime
    Duración de la prueba, formato Locust (default 3m). Ej: 30s, 2m, 5m.

.PARAMETER Scenario
    normal (default) = solo VisitanteAnonimo.
    stress           = rampa escalonada (StressShape); ignora Users/SpawnRate.
    auth             = VisitanteAnonimo + UsuarioAutenticado (requiere -User/-Pass).

.PARAMETER User
    Email de un usuario real (solo escenario auth).

.PARAMETER Pass
    Contraseña del usuario (solo escenario auth).

.EXAMPLE
    ./run-load-test.ps1 -Environment develop -Users 200 -SpawnRate 20 -RunTime 3m

.EXAMPLE
    ./run-load-test.ps1 -Environment release -Scenario stress

.EXAMPLE
    ./run-load-test.ps1 -Environment develop -Scenario auth -User demo@quetxal.tv -Pass 'secreto'
#>
param(
    [string]$Environment = "develop",
    [int]$Users = 200,
    [int]$SpawnRate = 20,
    [string]$RunTime = "3m",
    [ValidateSet("normal", "stress", "auth")]
    [string]$Scenario = "normal",
    [string]$User = "",
    [string]$Pass = ""
)

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

# --- Resolver host del entorno -------------------------------------------------
switch ($Environment.ToLower()) {
    "develop" { $Host_ = "http://34.123.30.232" }
    "release" { $Host_ = "http://35.254.220.20" }
    default   { $Host_ = $Environment }  # se asume una URL completa
}

# --- Preparar carpeta y nombres de salida -------------------------------------
New-Item -ItemType Directory -Force -Path "reports" | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$envLabel = ($Environment.ToLower() -replace '[^a-z0-9]', '-')
$base = "reports/quetxal-$envLabel-$stamp"
$html = "$base.html"
$csv = $base

# --- Variables de entorno para el escenario -----------------------------------
$env:QUETXAL_HOST = $Host_
$userClasses = @("VisitanteAnonimo")

if ($Scenario -eq "stress") {
    $env:QUETXAL_SHAPE = "stress"
    Write-Host "Escenario STRESS: rampa escalonada (se ignoran -Users/-SpawnRate)." -ForegroundColor Yellow
} else {
    Remove-Item Env:\QUETXAL_SHAPE -ErrorAction SilentlyContinue
}

if ($Scenario -eq "auth") {
    if (-not $User -or -not $Pass) {
        throw "El escenario 'auth' requiere -User y -Pass."
    }
    $env:QUETXAL_USER = $User
    $env:QUETXAL_PASS = $Pass
    $userClasses += "UsuarioAutenticado"
}

# --- Construir y ejecutar el comando Locust -----------------------------------
$locustArgs = @(
    "-f", "locustfile.py",
    "--host", $Host_,
    "--headless",
    "--run-time", $RunTime,
    "--html", $html,
    "--csv", $csv
)
if ($Scenario -ne "stress") {
    $locustArgs += @("--users", $Users, "--spawn-rate", $SpawnRate)
}
$locustArgs += $userClasses

Write-Host "==> Locust contra $Host_  (escenario: $Scenario)" -ForegroundColor Cyan
Write-Host "    Reporte HTML: $html" -ForegroundColor Cyan
Write-Host ""

locust @locustArgs

if (Test-Path $html) {
    Write-Host ""
    Write-Host "OK. Reporte generado: $html" -ForegroundColor Green
} else {
    Write-Warning "Locust terminó pero no se encontró el reporte HTML esperado."
}
