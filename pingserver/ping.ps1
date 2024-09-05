$url = "http://192.168.20.45:3000/ping"
#$url = "http://http://180.150.100.57:3000/ping"

try {
    $response = Invoke-WebRequest -Uri $url -UseBasicP
} catch {
    Write-Host "Failed to ping server: $_"
}