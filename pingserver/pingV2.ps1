$url = "http://192.168.20.45:3000/ping"
# $url = "http://http://180.150.100.57:3000/ping"

# Retrieve the computer name
$computerName = $env:COMPUTERNAME

# Function to send a ping request
function Send-Ping {
    param (
        [string]$url,
        [string]$computerName
    )

    $body = @{
        timestamp = (Get-Date).ToString("o")
        systemName = $computerName
        message = "Ping from $computerName"
    }

    # Convert the body to JSON format
    $jsonBody = $body | ConvertTo-Json

    try {
        # Send the HTTP POST request
        $response = Invoke-WebRequest -Uri $url -Method Post -Body $jsonBody -ContentType "application/json" -ErrorAction SilentlyContinue
        # Suppress output to prevent pop-ups
        $null = $response
    } catch {
        # Handle errors silently or log them
        # Optionally write to a log file
        $null = $_
    }
}

# Run the function every 20 seconds
while ($true) {
    Send-Ping -url $url -computerName $computerName
    Start-Sleep -Seconds 3
}
