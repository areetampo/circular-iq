# Setup Verification Script
# Checks your progress through the Circular Economy setup
#
# Usage: powershell -ExecutionPolicy Bypass -File verify_setup.ps1

$ErrorActionPreference = "Continue"

function Test-FileExists {
    param([string]$Path, [string]$Description)
    if (Test-Path $Path) {
        Write-Host "✅ $Description" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ $Description" -ForegroundColor Red
        return $false
    }
}

function Test-EnvVariable {
    param([string]$VarName)
    $envPath = ".env"
    if (Test-Path $envPath) {
        $content = Get-Content $envPath -Raw
        if ($content -match "$VarName\s*=\s*\S+") {
            Write-Host "✅ $VarName is set" -ForegroundColor Green
            return $true
        }
    }
    Write-Host "❌ $VarName not found in .env" -ForegroundColor Red
    return $false
}

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║    Circular Economy Setup Verification                          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Check current directory
$currentDir = Get-Location
Write-Host "📂 Current directory: $currentDir`n" -ForegroundColor Yellow

# ===== STEP 1: RAW DATASETS =====
Write-Host "━━━━━ STEP 1: Raw Datasets ━━━━━" -ForegroundColor Cyan
$rawPath = "dataset\raw"
if (Test-Path $rawPath) {
    $csvFiles = Get-ChildItem $rawPath -Filter "*.csv" | Where-Object { $_.Length -gt 0 }
    Write-Host "✅ Found $($csvFiles.Count) non-empty CSV files:" -ForegroundColor Green
    foreach ($file in $csvFiles) {
        $sizeMB = [math]::Round($file.Length / 1MB, 2)
        Write-Host "   • $($file.Name) ($sizeMB MB)" -ForegroundColor White
    }
} else {
    Write-Host "❌ dataset\raw directory not found" -ForegroundColor Red
}

# ===== STEP 2: COMBINED INPUT =====
Write-Host "`n━━━━━ STEP 2: Combined Input ━━━━━" -ForegroundColor Cyan
$combinedExists = Test-FileExists "dataset\combined_input.csv" "dataset\combined_input.csv exists"
if ($combinedExists) {
    try {
        $lines = (Get-Content "dataset\combined_input.csv" | Measure-Object -Line).Lines
        Write-Host "   📊 Rows: $lines" -ForegroundColor White
        
        $firstLine = Get-Content "dataset\combined_input.csv" -First 1
        $columns = ($firstLine -split ',').Count
        Write-Host "   📊 Columns: $columns" -ForegroundColor White
        Write-Host "   📊 Headers: $firstLine" -ForegroundColor White
    } catch {
        Write-Host "   ⚠ Could not read file details" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ℹ Run merge_datasets.ps1 to create this file" -ForegroundColor Yellow
}

# ===== STEP 3: ENVIRONMENT VARIABLES =====
Write-Host "`n━━━━━ STEP 3: Environment Variables ━━━━━" -ForegroundColor Cyan
Test-FileExists ".env" ".env file exists" | Out-Null
if (Test-Path ".env") {
    Test-EnvVariable "OPENAI_API_KEY" | Out-Null
    Test-EnvVariable "SUPABASE_URL" | Out-Null
    Test-EnvVariable "SUPABASE_SERVICE_ROLE_KEY" | Out-Null
} else {
    Write-Host "   ℹ Copy .env.example to .env and add your keys" -ForegroundColor Yellow
}

# ===== STEP 4: NODE MODULES =====
Write-Host "`n━━━━━ STEP 4: Dependencies ━━━━━" -ForegroundColor Cyan
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules directory exists" -ForegroundColor Green
    
    # Check key packages
    $packages = @("openai", "@supabase/supabase-js", "csv-parse", "dotenv")
    foreach ($pkg in $packages) {
        if (Test-Path "node_modules\$pkg") {
            Write-Host "   ✅ $pkg installed" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $pkg missing" -ForegroundColor Red
        }
    }
} else {
    Write-Host "❌ node_modules not found" -ForegroundColor Red
    Write-Host "   ℹ Run: npm install" -ForegroundColor Yellow
}

# ===== STEP 5: CHUNKS =====
Write-Host "`n━━━━━ STEP 5: Chunks Generated ━━━━━" -ForegroundColor Cyan
$chunksExists = Test-FileExists "dataset\chunks.json" "dataset\chunks.json exists"
if ($chunksExists) {
    try {
        $chunksContent = Get-Content "dataset\chunks.json" -Raw | ConvertFrom-Json
        Write-Host "   📊 Total chunks: $($chunksContent.Count)" -ForegroundColor White
        
        if ($chunksContent.Count -gt 0) {
            $sample = $chunksContent[0]
            Write-Host "   📊 Sample chunk ID: $($sample.id)" -ForegroundColor White
            Write-Host "   📊 Sample content length: $($sample.content.Length) chars" -ForegroundColor White
        }
    } catch {
        Write-Host "   ⚠ Could not parse chunks.json" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ℹ Run: node scripts/chunk.js" -ForegroundColor Yellow
}

# ===== STEP 6: DRY RUN OUTPUT =====
Write-Host "`n━━━━━ STEP 6: Dry Run Output ━━━━━" -ForegroundColor Cyan
$dryRunExists = Test-FileExists "dataset\stored_documents.jsonl" "dataset\stored_documents.jsonl exists"
if ($dryRunExists) {
    try {
        $lines = (Get-Content "dataset\stored_documents.jsonl" | Measure-Object -Line).Lines
        Write-Host "   📊 Documents: $lines" -ForegroundColor White
    } catch {
        Write-Host "   ⚠ Could not read file" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ℹ Run: node scripts/embed_and_store.js --dry-run" -ForegroundColor Yellow
}

# ===== STEP 7: SCRIPTS =====
Write-Host "`n━━━━━ STEP 7: Processing Scripts ━━━━━" -ForegroundColor Cyan
Test-FileExists "scripts\chunk.js" "chunk.js exists" | Out-Null
Test-FileExists "scripts\embed_and_store.js" "embed_and_store.js exists" | Out-Null
Test-FileExists "scripts\test_e2e_pipeline.js" "test_e2e_pipeline.js exists" | Out-Null

# ===== SUMMARY =====
Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    SETUP STATUS SUMMARY                          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$completedSteps = 0
$totalSteps = 7

if (Test-Path "dataset\raw") { $completedSteps++ }
if (Test-Path "dataset\combined_input.csv") { $completedSteps++ }
if (Test-Path ".env") { $completedSteps++ }
if (Test-Path "node_modules") { $completedSteps++ }
if (Test-Path "dataset\chunks.json") { $completedSteps++ }
if (Test-Path "dataset\stored_documents.jsonl") { $completedSteps++ }
if (Test-Path "scripts\chunk.js") { $completedSteps++ }

$percentage = [math]::Round(($completedSteps / $totalSteps) * 100)

Write-Host "Progress: $completedSteps/$totalSteps steps completed ($percentage%)`n" -ForegroundColor $(if ($completedSteps -eq $totalSteps) { "Green" } else { "Yellow" })

if ($completedSteps -lt $totalSteps) {
    Write-Host "📋 NEXT STEPS:" -ForegroundColor Yellow
    Write-Host ""
    
    if (!(Test-Path "dataset\combined_input.csv")) {
        Write-Host "  1. Create combined input:" -ForegroundColor White
        Write-Host "     powershell -ExecutionPolicy Bypass -File merge_datasets.ps1" -ForegroundColor Gray
        Write-Host ""
    }
    
    if (!(Test-Path ".env")) {
        Write-Host "  2. Set up environment:" -ForegroundColor White
        Write-Host "     Copy .env.example to .env" -ForegroundColor Gray
        Write-Host "     Add your OPENAI_API_KEY and SUPABASE keys" -ForegroundColor Gray
        Write-Host ""
    }
    
    if (!(Test-Path "node_modules")) {
        Write-Host "  3. Install dependencies:" -ForegroundColor White
        Write-Host "     npm install" -ForegroundColor Gray
        Write-Host ""
    }
    
    if (!(Test-Path "dataset\chunks.json")) {
        Write-Host "  4. Generate chunks:" -ForegroundColor White
        Write-Host "     node scripts/chunk.js dataset/combined_input.csv dataset/chunks.json" -ForegroundColor Gray
        Write-Host ""
    }
    
    if (!(Test-Path "dataset\stored_documents.jsonl")) {
        Write-Host "  5. Test embedding (dry run):" -ForegroundColor White
        Write-Host "     node scripts/embed_and_store.js --dry-run" -ForegroundColor Gray
        Write-Host ""
    }
} else {
    Write-Host "🎉 All setup steps completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ready to generate embeddings:" -ForegroundColor Yellow
    Write-Host "  node scripts/embed_and_store.js" -ForegroundColor White
    Write-Host ""
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
