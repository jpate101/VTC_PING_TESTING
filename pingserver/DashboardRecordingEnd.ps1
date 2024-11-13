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

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

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

    public static void BringWindowToFront(string windowTitle)
    {
        IntPtr hWnd = FindWindow(null, windowTitle);
        if (hWnd != IntPtr.Zero)
        {
            SetForegroundWindow(hWnd);
        }
        else
        {
            throw new Exception("Window not found");
        }
    }
}
"@ -Language CSharp

# Define the path to the application and the window title
$applicationPath = "C:\Program Files (x86)\TBS Electronics\Dashboard\2.0\Dashboard.exe"
$windowTitle = "TBS Electronics - Dashboard"

# Define the process name (no file extension)
$processName = "Dashboard"

# Check if the application is already running
$runningProcess = Get-Process -Name $processName -ErrorAction SilentlyContinue

# If the process is not running, start it
if ($runningProcess -eq $null) {
    Write-Output "Starting the application..."
    Start-Process -FilePath $applicationPath

    # Sleep to allow the application to start before proceeding (adjust timing as needed)
    Start-Sleep -Seconds 20
} else {
    Write-Output "The application is already running."
}

# Load the necessary .NET assembly for SendKeys
Add-Type -AssemblyName System.Windows.Forms

Start-Sleep -Seconds 3

try {
    # Bring the window to the foreground
    [UniqueWindowHelper]::BringWindowToFront($windowTitle)

    Start-Sleep -Seconds 15

    [System.Windows.Forms.SendKeys]::SendWait("%(f)") # Send Alt + F

    Start-Sleep -Milliseconds 700 # Wait for the menu to open

    [System.Windows.Forms.SendKeys]::SendWait("{DOWN}") # Send {TAB}

    Start-Sleep -Milliseconds 700 # Wait for the menu to open

    [System.Windows.Forms.SendKeys]::SendWait("{ENTER}") # Send {ENTER}

    Start-Sleep -Milliseconds 700 # Wait for the menu to open

    [System.Windows.Forms.SendKeys]::SendWait("{ENTER}") # Send {ENTER}

} catch {
    Write-Output "Error: $_"
}