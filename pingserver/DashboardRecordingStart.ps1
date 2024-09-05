# Add the necessary types and functions
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class UniqueWindowHelper
{
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [DllImport("user32.dll")]
    public static extern void SetCursorPos(int X, int Y);

    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, int dx, int dy, uint dwData, int dwExtraInfo);

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT
    {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    // Mouse event constants
    public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    public const uint MOUSEEVENTF_LEFTUP = 0x0004;

    public static RECT GetWindowRectangle(string windowTitle)
    {
        IntPtr hWnd = FindWindow(null, windowTitle);
        if (hWnd == IntPtr.Zero)
            throw new Exception("Window not found");

        RECT rect;
        if (GetWindowRect(hWnd, out rect))
            return rect;
        else
            throw new Exception("Failed to get window rectangle");
    }

    public static void MouseClick(int x, int y)
    {
        SetCursorPos(x, y);
        mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
        System.Threading.Thread.Sleep(50); // Short delay to simulate a real click
        mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
    }
}
"@ -Language CSharp

# Define the path to the application and the window title
$applicationPath = "C:\Program Files (x86)\TBS Electronics\Dashboard\2.0\Dashboard.exe"
$windowTitle = "TBS Electronics - Dashboard"

# Start the application
Start-Process -FilePath $applicationPath

# Sleep to allow the application to start before proceeding (adjust timing as needed)
Start-Sleep -Seconds 3

# Retrieve the window's rectangle
try {
    $rect = [UniqueWindowHelper]::GetWindowRectangle($windowTitle)

    # Calculate window dimensions
    $windowWidth = $rect.Right - $rect.Left
    $windowHeight = $rect.Bottom - $rect.Top


    # Calculate click positions
    $xPosition = $rect.Left + [math]::Round($windowWidth * .025)
    $yPosition = $rect.Top + [math]::Round($windowHeight * .07)

    # Perform clicks
    [UniqueWindowHelper]::MouseClick($xPosition, $yPosition)
    Write-Output "First mouse click at: ($xPosition, $yPosition)"

    # Update positions for subsequent clicks, relative to the window size
    $xPosition += [math]::Round($windowWidth * 0 )  # Move right 5% of window width
    $yPosition += [math]::Round($windowHeight * 0.05)  # Move down 3% of window height
    [UniqueWindowHelper]::MouseClick($xPosition, $yPosition)
    Write-Output "Second mouse click at: ($xPosition, $yPosition)"

    $xPosition += [math]::Round($windowWidth * 0.60)  # Move right 10% of window width
    $yPosition += [math]::Round($windowHeight * 0.73)  # Move down 10% of window height
    [UniqueWindowHelper]::MouseClick($xPosition, $yPosition)
    Write-Output "Third mouse click at: ($xPosition, $yPosition)"

    [UniqueWindowHelper]::MouseClick($xPosition, $yPosition)
    Write-Output "Fourth mouse click at: ($xPosition, $yPosition)"

    $xPosition -= [math]::Round($windowWidth * 0.40)  # Move right 10% of window width
    $yPosition -= [math]::Round($windowHeight * 0.10)  # Move down 10% of window height
    [UniqueWindowHelper]::MouseClick($xPosition, $yPosition)
    Write-Output "Fifth mouse click at: ($xPosition, $yPosition)"

    #SetCursorPos

} catch {
    Write-Output "Error: $_"
}