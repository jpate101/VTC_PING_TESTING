# Define the server URL
$url = "http://192.168.20.45:3000/ping"

# Get the system name
$systemName = $env:COMPUTERNAME

# Define the interval in seconds
$interval = 20

# Loop indefinitely
while ($true) {
    try {
        # Create the payload
        $payload = @{
            systemName = $systemName
        } | ConvertTo-Json

        # Send the POST request
        $response = Invoke-WebRequest -Uri $url -Method Post -Body $payload -ContentType "application/json"

        # Write the response status
        Write-Host "Ping sent successfully. Response status: $($response.StatusCode)"
    } catch {
        Write-Host "Failed to ping server: $_"
    }

    # Wait for the specified interval before sending the next ping
    Start-Sleep -Seconds $interval
}