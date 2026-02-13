$outputPath = "combined_input.csv"
$allData = @()

# 1. Add GreenTechGuardians Data
Write-Host "Processing GreenTechGuardians..."
$gtgPath = "GreenTechGuardians\AI_EarthHack_Dataset.csv"
if (Test-Path $gtgPath) {
    $gtgData = Import-Csv $gtgPath | ForEach-Object {
        [PSCustomObject]@{
            ID = "gtg_$($_.id)"
            problem = $_.problem
            solution = $_.solution
            materials = ""
            circular_strategy = ""
            category = "GreenTech"
            impact = ""
        }
    }
    $allData += $gtgData
}

# 2. Add OWID CO2 data
Write-Host "Processing OWID CO2..."
$allData += Import-Csv "raw\owid_co2_data.csv" | Select-Object -First 500 | ForEach-Object {
    [PSCustomObject]@{
        ID = "co2_$($_.iso_code)_$($_.year)"
        problem = "High carbon emissions in $($_.country) ($($_.year))"
        solution = "Transition to renewable energy"
        materials = "Fossil fuels"
        circular_strategy = "Reduction"
        category = "Energy"
        impact = "$($_.co2) million tonnes"
    }
}

# 3. Export everything
$allData | Export-Csv -Path $outputPath -NoTypeInformation
Write-Host "✓ Master combined_input.csv created with $($allData.Count) rows"
