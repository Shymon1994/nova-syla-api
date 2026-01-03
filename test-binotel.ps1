# Test Binotel Call Password Integration

$baseUrl = "http://localhost:3001/api/v2/auth"
$testPhone = "+380960608968"

Write-Host "Testing Binotel Call Password Integration" -ForegroundColor Cyan
Write-Host "Phone: $testPhone" -ForegroundColor Yellow
Write-Host ""

# Test 1: Request Code
Write-Host "Step 1: Requesting Call Password code..." -ForegroundColor Green

$requestBody = @{
    phone = $testPhone
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/request-code" -Method Post -Body $requestBody -ContentType "application/json"
    
    Write-Host "Success!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor White
    Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor Gray
    Write-Host ""
    Write-Host "Wait for call on: $testPhone" -ForegroundColor Cyan
    Write-Host "Enter last 4 digits of the caller number" -ForegroundColor Cyan
    
} catch {
    Write-Host "Error!" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "Response: $responseBody" -ForegroundColor Red
}
