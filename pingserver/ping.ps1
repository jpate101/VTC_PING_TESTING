# Define the server URL
$url = "http://192.168.20.45:3000/ping"

# Get the system name
$systemName = $env:COMPUTERNAME

# Create a custom object to send the system name with the request
$body = @{
    systemName = $systemName
}

try {
    # Send a POST request with the system name included in the body
    $response = Invoke-WebRequest -Uri $url -Method Post -Body ($body | ConvertTo-Json) -ContentType "application/json"

    # Output the response from the server
    Write-Host "Response from server: $($response.Content)"
} catch {
    Write-Host "Failed to ping server: $_"
}