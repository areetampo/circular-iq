# Circular Economy Dataset Merger
# Converts downloaded environmental datasets into the format expected by chunk.js
#
# Usage: Run this from backend/dataset/ directory
#   powershell -ExecutionPolicy Bypass -File merge_datasets.ps1

$ErrorActionPreference = "Stop"

Write-Host "`n=== Circular Economy Dataset Merger ===" -ForegroundColor Cyan
Write-Host "Converting raw datasets to combined_input.csv`n"

# Configuration
$rawDir = "raw"
$outputFile = "combined_input.csv"
$maxRowsPerDataset = 200  # Limit rows per dataset to avoid huge files

# Initialize combined data array
$allRecords = @()
$recordId = 1

# Function to create standardized record
function New-CircularRecord {
    param(
        [string]$id,
        [string]$problem,
        [string]$solution,
        [string]$materials = "",
        [string]$circular_strategy = "",
        [string]$category = "General",
        [string]$impact = ""
    )
    
    return [PSCustomObject]@{
        ID = $id
        problem = $problem
        solution = $solution
        materials = $materials
        circular_strategy = $circular_strategy
        category = $category
        impact = $impact
    }
}

# ===== PROCESS CO2 EMISSIONS DATA =====
Write-Host "1️⃣  Processing CO2 emissions data..." -ForegroundColor Yellow
$co2Path = Join-Path $rawDir "owid_co2_data.csv"

if (Test-Path $co2Path) {
    try {
        $co2Data = Import-Csv $co2Path -ErrorAction Stop | 
            Where-Object { $_.country -and $_.year -and $_.co2 } |
            Select-Object -First $maxRowsPerDataset
        
        foreach ($row in $co2Data) {
            $country = $row.country
            $year = $row.year
            $co2 = $row.co2
            $population = if ($row.population) { $row.population } else { "unknown population" }
            
            $problem = "High carbon emissions in $country ($year): $co2 million tonnes CO2 with $population people"
            $solution = "Implement renewable energy transition, improve energy efficiency, and establish carbon capture programs"
            
            $allRecords += New-CircularRecord `
                -id "co2_${recordId}" `
                -problem $problem `
                -solution $solution `
                -materials "Fossil fuels, energy infrastructure" `
                -circular_strategy "Reduction" `
                -category "Climate & Emissions" `
                -impact "Potential CO2 reduction through energy transition"
            
            $recordId++
        }
        Write-Host "   ✓ Added $($co2Data.Count) CO2 emission records" -ForegroundColor Green
    }
    catch {
        Write-Host "   ⚠ Warning: Could not process CO2 data: $_" -ForegroundColor Yellow
    }
}
else {
    Write-Host "   ⚠ Skipping: owid_co2_data.csv not found" -ForegroundColor Yellow
}

# ===== PROCESS ENERGY DATA =====
Write-Host "`n2️⃣  Processing energy data..." -ForegroundColor Yellow
$energyPath = Join-Path $rawDir "owid_energy_data.csv"

if (Test-Path $energyPath) {
    try {
        $energyData = Import-Csv $energyPath -ErrorAction Stop |
            Where-Object { $_.country -and $_.year } |
            Select-Object -First $maxRowsPerDataset
        
        foreach ($row in $energyData) {
            $country = $row.country
            $year = $row.year
            $renewable = if ($row.renewables_share_energy) { $row.renewables_share_energy } else { "unknown" }
            
            $problem = "Energy transition challenge in $country ($year) with renewable share at $renewable%"
            $solution = "Deploy solar and wind infrastructure, modernize grid systems, implement energy storage solutions"
            
            $allRecords += New-CircularRecord `
                -id "energy_${recordId}" `
                -problem $problem `
                -solution $solution `
                -materials "Solar panels, wind turbines, batteries, grid infrastructure" `
                -circular_strategy "Regeneration" `
                -category "Renewable Energy" `
                -impact "Increased renewable energy adoption and grid resilience"
            
            $recordId++
        }
        Write-Host "   ✓ Added $($energyData.Count) energy records" -ForegroundColor Green
    }
    catch {
        Write-Host "   ⚠ Warning: Could not process energy data: $_" -ForegroundColor Yellow
    }
}
else {
    Write-Host "   ⚠ Skipping: owid_energy_data.csv not found" -ForegroundColor Yellow
}

# ===== PROCESS EPA TRI DATA =====
Write-Host "`n3️⃣  Processing EPA TRI data..." -ForegroundColor Yellow
$epaPath = Join-Path $rawDir "epa_tri_custom.csv"

if (Test-Path $epaPath) {
    try {
        $epaData = Import-Csv $epaPath -ErrorAction Stop |
            Select-Object -First $maxRowsPerDataset
        
        foreach ($row in $epaData) {
            $facility = if ($row.'Facility Name') { $row.'Facility Name' } else { "Industrial facility" }
            $chemical = if ($row.'Chemical') { $row.'Chemical' } else { "chemical substances" }
            $city = if ($row.'City') { $row.'City' } else { "location" }
            
            $problem = "Toxic release from $facility in $city: $chemical emissions requiring management"
            $solution = "Implement pollution prevention programs, substitute with safer materials, improve containment systems"
            
            $allRecords += New-CircularRecord `
                -id "epa_${recordId}" `
                -problem $problem `
                -solution $solution `
                -materials "Industrial chemicals, containment systems" `
                -circular_strategy "Reduction" `
                -category "Waste & Toxics" `
                -impact "Reduced toxic emissions and improved environmental safety"
            
            $recordId++
        }
        Write-Host "   ✓ Added $($epaData.Count) EPA TRI records" -ForegroundColor Green
    }
    catch {
        Write-Host "   ⚠ Warning: Could not process EPA data: $_" -ForegroundColor Yellow
    }
}
else {
    Write-Host "   ⚠ Skipping: epa_tri_custom.csv not found" -ForegroundColor Yellow
}

# ===== PROCESS GHG EMISSIONS =====
Write-Host "`n4️⃣  Processing GHG emissions data..." -ForegroundColor Yellow
$ghgPath = Join-Path $rawDir "ghg_emissions.csv"

if (Test-Path $ghgPath) {
    try {
        $ghgData = Import-Csv $ghgPath -ErrorAction Stop |
            Select-Object -First $maxRowsPerDataset
        
        foreach ($row in $ghgData) {
            $year = if ($row.Year) { $row.Year } else { "recent years" }
            $total = if ($row.'Total') { $row.'Total' } else { "significant" }
            
            $problem = "Global greenhouse gas emissions in $year totaling $total million tonnes requiring urgent mitigation"
            $solution = "Transition to renewable energy, improve agricultural practices, implement carbon pricing and nature-based solutions"
            
            $allRecords += New-CircularRecord `
                -id "ghg_${recordId}" `
                -problem $problem `
                -solution $solution `
                -materials "Energy systems, agriculture, forestry" `
                -circular_strategy "Reduction" `
                -category "Climate & Emissions" `
                -impact "Global emissions reduction and climate stabilization"
            
            $recordId++
        }
        Write-Host "   ✓ Added $($ghgData.Count) GHG records" -ForegroundColor Green
    }
    catch {
        Write-Host "   ⚠ Warning: Could not process GHG data: $_" -ForegroundColor Yellow
    }
}
else {
    Write-Host "   ⚠ Skipping: ghg_emissions.csv not found" -ForegroundColor Yellow
}

# ===== PROCESS ENVIRONMENTAL SUSTAINABILITY =====
Write-Host "`n5️⃣  Processing environmental sustainability data..." -ForegroundColor Yellow
$envPath = Join-Path $rawDir "environmental_sustainability.csv"

if (Test-Path $envPath) {
    try {
        $envData = Import-Csv $envPath -ErrorAction Stop |
            Select-Object -First $maxRowsPerDataset
        
        foreach ($row in $envData) {
            # Try to extract meaningful fields (structure may vary)
            $country = if ($row.Country) { $row.Country } else { "region" }
            $indicator = if ($row.Indicator) { $row.Indicator } else { "environmental indicator" }
            
            $problem = "Environmental sustainability challenge in $country related to $indicator"
            $solution = "Implement sustainable practices, improve monitoring systems, engage stakeholders in conservation efforts"
            
            $allRecords += New-CircularRecord `
                -id "env_${recordId}" `
                -problem $problem `
                -solution $solution `
                -materials "Natural resources, monitoring systems" `
                -circular_strategy "Regeneration" `
                -category "Conservation" `
                -impact "Improved environmental outcomes and ecosystem health"
            
            $recordId++
        }
        Write-Host "   ✓ Added $($envData.Count) environmental records" -ForegroundColor Green
    }
    catch {
        Write-Host "   ⚠ Warning: Could not process environmental data: $_" -ForegroundColor Yellow
    }
}
else {
    Write-Host "   ⚠ Skipping: environmental_sustainability.csv not found" -ForegroundColor Yellow
}

# ===== EXPORT COMBINED DATA =====
Write-Host "`n6️⃣  Exporting combined dataset..." -ForegroundColor Yellow

if ($allRecords.Count -eq 0) {
    Write-Host "   ✗ ERROR: No records processed! Check your CSV files." -ForegroundColor Red
    exit 1
}

try {
    $allRecords | Export-Csv -Path $outputFile -NoTypeInformation -Encoding UTF8
    Write-Host "   ✓ Exported $($allRecords.Count) records to $outputFile" -ForegroundColor Green
}
catch {
    Write-Host "   ✗ ERROR: Failed to export: $_" -ForegroundColor Red
    exit 1
}

# ===== VALIDATION =====
Write-Host "`n7️⃣  Validating output..." -ForegroundColor Yellow

try {
    $validation = Import-Csv $outputFile
    $sampleRow = $validation | Select-Object -First 1
    
    Write-Host "   ✓ File readable" -ForegroundColor Green
    Write-Host "   ✓ Columns: $($sampleRow.PSObject.Properties.Name -join ', ')" -ForegroundColor Green
    Write-Host "   ✓ Sample problem: $($sampleRow.problem.Substring(0, [Math]::Min(80, $sampleRow.problem.Length)))..." -ForegroundColor Green
}
catch {
    Write-Host "   ⚠ Warning: Could not validate output: $_" -ForegroundColor Yellow
}

# ===== SUMMARY =====
Write-Host "`n" + ("=" * 70) -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host "✅ Total records created: $($allRecords.Count)" -ForegroundColor Green
Write-Host "📁 Output file: $outputFile" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. Review $outputFile to ensure data quality" -ForegroundColor White
Write-Host "  2. Run: node scripts/chunk.js dataset/$outputFile dataset/chunks.json" -ForegroundColor White
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host ""
