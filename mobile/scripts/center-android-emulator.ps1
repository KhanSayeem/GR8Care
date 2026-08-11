param(
  [int]$WaitSeconds = 60,
  [string]$AvdName = $env:GR8CARE_ANDROID_AVD_NAME,
  [int]$StabilizeSeconds = 12
)

$ErrorActionPreference = "SilentlyContinue"

Add-Type -AssemblyName System.Windows.Forms

$workArea = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
$targetWidth = 276
$targetHeight = 617
$targetX = [Math]::Max($workArea.Left, [int]($workArea.Left + (($workArea.Width - $targetWidth) / 2)))
$targetY = [Math]::Max($workArea.Top, [int]($workArea.Top + (($workArea.Height - $targetHeight) / 2)))

$androidUserHome = Join-Path $env:USERPROFILE ".android"
$avdUserIni = if ($AvdName) { Join-Path $androidUserHome "avd\$AvdName.avd\emulator-user.ini" } else { $null }

if ($avdUserIni -and (Test-Path -LiteralPath $avdUserIni)) {
  $settings = [ordered]@{
    "window.x" = $targetX
    "window.y" = $targetY
    "window.scale" = "0.250000"
  }

  $content = Get-Content -LiteralPath $avdUserIni
  foreach ($key in @($settings.Keys)) {
    $value = $settings[$key]
    if ($content -match "^\s*$([regex]::Escape($key))\s*=") {
      $content = $content | ForEach-Object {
        if ($_ -match "^\s*$([regex]::Escape($key))\s*=") { "$key = $value" } else { $_ }
      }
    } else {
      $content += "$key = $value"
    }
  }
  Set-Content -LiteralPath $avdUserIni -Value $content -Encoding ASCII
}

$source = @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public static class Win32WindowTools {
  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

  [DllImport("user32.dll")]
  public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);

  [DllImport("user32.dll")]
  public static extern bool IsWindowVisible(IntPtr hWnd);

  [DllImport("user32.dll", CharSet = CharSet.Unicode)]
  public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

  [DllImport("user32.dll")]
  public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);

  [DllImport("user32.dll")]
  public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);

  [DllImport("user32.dll")]
  public static extern bool MoveWindow(IntPtr hWnd, int x, int y, int width, int height, bool repaint);

  public struct RECT {
    public int Left;
    public int Top;
    public int Right;
    public int Bottom;
  }
}
"@

Add-Type -TypeDefinition $source

function Get-EmulatorWindows {
  $windows = New-Object System.Collections.Generic.List[object]
  $callback = [Win32WindowTools+EnumWindowsProc]{
    param([IntPtr]$hWnd, [IntPtr]$lParam)

    if (-not [Win32WindowTools]::IsWindowVisible($hWnd)) {
      return $true
    }

    $titleBuilder = New-Object System.Text.StringBuilder 512
    [void][Win32WindowTools]::GetWindowText($hWnd, $titleBuilder, $titleBuilder.Capacity)
    $title = $titleBuilder.ToString()
    $windowProcessId = 0
    [void][Win32WindowTools]::GetWindowThreadProcessId($hWnd, [ref]$windowProcessId)
    $windowProcess = Get-Process -Id $windowProcessId -ErrorAction SilentlyContinue

    $isEmulatorTitle = $title -like "Android Emulator*" -or ($AvdName -and $title -like "*$AvdName*")
    $isEmulatorProcess = $windowProcess -and ($windowProcess.ProcessName -like "qemu*" -or $windowProcess.ProcessName -like "emulator*")

    if ($isEmulatorTitle -or $isEmulatorProcess) {
      $rect = New-Object Win32WindowTools+RECT
      [void][Win32WindowTools]::GetWindowRect($hWnd, [ref]$rect)
      $width = $rect.Right - $rect.Left
      $height = $rect.Bottom - $rect.Top

      if ($width -lt 240 -or $height -lt 400) {
        return $true
      }

      $windows.Add([pscustomobject]@{
        Handle = $hWnd
        ProcessId = $windowProcessId
        ProcessName = if ($windowProcess) { $windowProcess.ProcessName } else { "" }
        Title = $title
        Left = $rect.Left
        Top = $rect.Top
        Width = $width
        Height = $height
      })
    }

    return $true
  }

  [void][Win32WindowTools]::EnumWindows($callback, [IntPtr]::Zero)
  return $windows
}

$deadline = (Get-Date).AddSeconds($WaitSeconds)
$stabilizeDeadline = $null
do {
  $windows = Get-EmulatorWindows
  $movedWindow = $false

  foreach ($window in $windows) {
    $width = $window.Width
    $height = $window.Height

    if ($width -le 0 -or $height -le 0) {
      continue
    }

    $maxWidth = [int]($workArea.Width * 0.98)
    $maxHeight = [int]($workArea.Height * 0.92)
    $scale = [Math]::Min(1.0, [Math]::Min($maxWidth / $width, $maxHeight / $height))

    $newWidth = [Math]::Max(240, [int]($width * $scale))
    $newHeight = [Math]::Max(480, [int]($height * $scale))
    $newX = [Math]::Max($workArea.Left, [int]($workArea.Left + (($workArea.Width - $newWidth) / 2)))
    $newY = [Math]::Max($workArea.Top, [int]($workArea.Top + (($workArea.Height - $newHeight) / 2)))

    [void][Win32WindowTools]::MoveWindow($window.Handle, $newX, $newY, $newWidth, $newHeight, $true)
    $movedWindow = $true
  }

  if ($movedWindow -and -not $stabilizeDeadline) {
    $stabilizeDeadline = (Get-Date).AddSeconds($StabilizeSeconds)
  }

  if ($stabilizeDeadline -and (Get-Date) -ge $stabilizeDeadline) {
    exit 0
  }

  Start-Sleep -Milliseconds 750
} while ((Get-Date) -lt $deadline)
