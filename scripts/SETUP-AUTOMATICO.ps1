#Requires -Version 5.1
<#
  DryLeague — Vercel (app Expo em mobile/) + Supabase a partir da máquina local.
  Uso (PowerShell, na raiz do repo):
    .\scripts\SETUP-AUTOMATICO.ps1
    .\scripts\SETUP-AUTOMATICO.ps1 -SkipSupabase
    .\scripts\SETUP-AUTOMATICO.ps1 -SkipVercel
#>
param(
  [switch] $SkipVercel,
  [switch] $SkipSupabase
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root
Write-Host "Raiz do projeto: $Root" -ForegroundColor Cyan

if (-not $SkipVercel) {
  Write-Host "`n=== Vercel (app Expo — pasta mobile/) ===" -ForegroundColor Yellow
  Write-Host "Se falhar autenticação: npx vercel login`n"
  Push-Location (Join-Path $Root "mobile")
  try {
    npx vercel link --yes
    $pj = Join-Path $PWD ".vercel\project.json"
    if (Test-Path $pj) {
      Write-Host "`nConteúdo de .vercel/project.json (usa no GitHub → Secrets):" -ForegroundColor Green
      Get-Content $pj
      Write-Host "`nCria também VERCEL_TOKEN em https://vercel.com/account/tokens" -ForegroundColor Gray
    }
    $deploy = Read-Host "`nDeploy produção agora? (s/N)"
    if ($deploy -eq "s" -or $deploy -eq "S") {
      npx vercel deploy --prod
    }
  } finally {
    Pop-Location
  }
}

if (-not $SkipSupabase) {
  Write-Host "`n=== Supabase ===" -ForegroundColor Yellow
  Write-Host "Token: https://supabase.com/dashboard/account/tokens"
  $go = Read-Host "Correr login + link + db push? (s/N)"
  if ($go -eq "s" -or $go -eq "S") {
    npx supabase@latest login
    $ref = Read-Host "Project Reference ID (Dashboard → Settings → General)"
    if ($ref) {
      npx supabase@latest link --project-ref $ref
      npx supabase@latest db push
      Write-Host "`nGitHub Secrets: SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF=$ref" -ForegroundColor Gray
    }
  } else {
    Write-Host "Cola supabase/migrations/*.sql no SQL Editor do dashboard." -ForegroundColor Gray
  }
}

Write-Host "`n=== Git ===" -ForegroundColor Yellow
Write-Host "git remote add origin https://github.com/USER/REPO.git"
Write-Host "git branch -M main && git push -u origin main"
Write-Host "`nFeito." -ForegroundColor Green
