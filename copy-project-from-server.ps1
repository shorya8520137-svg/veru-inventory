# Copy inventoryfullstack project from server to local Desktop
$sshKey = "C:\Users\Public\e2c.pem.pem"
$serverUser = "ubuntu"
$serverIP = "13.212.38.57"
$desktopPath = "$env:USERPROFILE\Desktop"

Write-Host "=== Copying inventoryfullstack Project from Server ===" -ForegroundColor Green

# Target directory on Desktop
$projectDir = "$desktopPath\inventoryfullstack"

# Check if directory already exists
if (Test-Path $projectDir) {
    Write-Host "`nWarning: Directory already exists at $projectDir" -ForegroundColor Yellow
    $response = Read-Host "Do you want to overwrite it? (y/n)"
    if ($response -ne 'y') {
        Write-Host "Operation cancelled." -ForegroundColor Red
        exit
    }
    Remove-Item -Path $projectDir -Recurse -Force
}

# Copy the entire project directory from server
Write-Host "`nCopying project from server..." -ForegroundColor Yellow
Write-Host "This may take a few minutes depending on project size..." -ForegroundColor Cyan

$scpCommand = "scp -i `"$sshKey`" -r ${serverUser}@${serverIP}:~/inventoryfullstack `"$desktopPath\`""
Write-Host "Executing: $scpCommand" -ForegroundColor Cyan
Invoke-Expression $scpCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Project copied successfully!" -ForegroundColor Green
    Write-Host "Location: $projectDir" -ForegroundColor Cyan
    
    # Show project size
    $size = (Get-ChildItem -Path $projectDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "Project size: $([math]::Round($size, 2)) MB" -ForegroundColor Cyan
} else {
    Write-Host "`n✗ Failed to copy project" -ForegroundColor Red
}

Write-Host "`n=== Complete ===" -ForegroundColor Green
