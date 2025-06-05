# PowerShell script to delete irrelevant test and experimental files
$files = @(
    'c:\Github\tender-trackerz-sync-wizardold\server\print-tenders.ts',
    'c:\Github\tender-trackerz-sync-wizardold\server\scraper-v3.ts',
    'c:\Github\tender-trackerz-sync-wizardold\server\simple-test.ts',
    'c:\Github\tender-trackerz-sync-wizardold\server\test-scraper-v2.ts',
    'c:\Github\tender-trackerz-sync-wizardold\server\test-scraper.ts'
)
foreach ($file in $files) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "Deleted $file"
    } else {
        Write-Host "$file does not exist."
    }
}
