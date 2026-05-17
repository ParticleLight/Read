Add-Type -AssemblyName System.Drawing

$sizes = @(16, 24, 32, 48, 64, 128, 256)
$images = @()

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'HighQuality'
    $g.Clear([System.Drawing.Color]::Transparent)

    # Background: rounded rect in indigo-violet gradient
    $margin = [int]($size * 0.10)
    $r = [int]($size * 0.20)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Point(0, 0)),
        (New-Object System.Drawing.Point($size, $size)),
        [System.Drawing.Color]::FromArgb(255, 79, 70, 229),
        [System.Drawing.Color]::FromArgb(255, 124, 58, 237)
    )

    $rect = New-Object System.Drawing.Rectangle($margin, $margin, $size - 2*$margin, $size - 2*$margin)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc($rect.X, $rect.Y, $r, $r, 180, 90)
    $path.AddArc($rect.X + $rect.Width - $r, $rect.Y, $r, $r, 270, 90)
    $path.AddArc($rect.X + $rect.Width - $r, $rect.Y + $rect.Height - $r, $r, $r, 0, 90)
    $path.AddArc($rect.X, $rect.Y + $rect.Height - $r, $r, $r, 90, 90)
    $path.CloseFigure()
    $g.FillPath($brush, $path)
    $brush.Dispose()
    $path.Dispose()

    # Book pages in white
    $penWidth = [Math]::Max(1.0, $size * 0.05)
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, $penWidth)
    $pen.StartCap = 'Round'
    $pen.EndCap = 'Round'

    $cx = $size / 2.0
    $cy = $size / 2.0
    $bw = $size * 0.26
    $bh = $size * 0.30
    $sh = $size * 0.04

    # Left page
    $g.DrawLine($pen, $cx, $cy - $bh, $cx - $bw, $cy - $bh + $sh)
    $g.DrawLine($pen, $cx - $bw, $cy - $bh + $sh, $cx - $bw, $cy + $bh - $sh)
    $g.DrawLine($pen, $cx - $bw, $cy + $bh - $sh, $cx, $cy + $bh)

    # Right page
    $g.DrawLine($pen, $cx, $cy - $bh, $cx + $bw, $cy - $bh + $sh)
    $g.DrawLine($pen, $cx + $bw, $cy - $bh + $sh, $cx + $bw, $cy + $bh - $sh)
    $g.DrawLine($pen, $cx + $bw, $cy + $bh - $sh, $cx, $cy + $bh)

    # Center spine
    $spTop = $cy - $bh - $size * 0.015
    $spBot = $cy + $bh + $size * 0.015
    $g.DrawLine($pen, $cx, $spTop, $cx, $spBot)

    # Page lines (subtle)
    $thinPen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, [Math]::Max(0.5, $size * 0.012))
    $lineGap = $size * 0.07
    for ($y = $cy - $bh + $size * 0.12; $y -lt $cy + $bh; $y += $lineGap) {
        if ($y + $lineGap -gt $cy + $bh - $size * 0.08) { break }
        $midX = ($y - $cy) / ($bh) * $bw * 0.15
        $g.DrawLine($thinPen, $cx - $bw + $size * 0.06 + $midX, $y, $cx - $size * 0.015, $y)
        $g.DrawLine($thinPen, $cx + $size * 0.015, $y, $cx + $bw - $size * 0.06 - $midX, $y)
    }
    $thinPen.Dispose()

    $pen.Dispose()
    $g.Dispose()
    $images += $bmp
}

# Save as ICO with PNG-compressed images
$icoPath = Join-Path $PSScriptRoot "..\assets\app.ico"
$dir = [System.IO.Path]::GetDirectoryName((Resolve-Path $icoPath -ErrorAction SilentlyContinue))
if ($dir) { } else {
    $dirPath = Join-Path $PSScriptRoot "..\assets"
    New-Item -ItemType Directory -Path $dirPath -Force | Out-Null
}
$icoPath = Join-Path $PSScriptRoot "..\assets\app.ico"

$fs = [System.IO.File]::Create($icoPath)
$bw = New-Object System.IO.BinaryWriter($fs)

# ICO header
$bw.Write([uint16]0)       # reserved
$bw.Write([uint16]1)       # ICO type
$bw.Write([uint16]$images.Count)

$offset = 6 + 16 * $images.Count
$pngDataList = @()

for ($i = 0; $i -lt $images.Count; $i++) {
    $s = $sizes[$i]
    if ($s -ge 256) { $s = 0 }
    $bw.Write([byte]$s)
    $bw.Write([byte]$s)
    $bw.Write([byte]0)     # palette
    $bw.Write([byte]0)     # reserved
    $bw.Write([uint16]1)   # color planes
    $bw.Write([uint16]32)  # bpp
    $ms = New-Object System.IO.MemoryStream
    $images[$i].Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngBytes = $ms.ToArray()
    $ms.Dispose()
    $pngDataList += $pngBytes
    $bw.Write([uint32]$pngBytes.Length)
    $bw.Write([uint32]$offset)
    $offset += $pngBytes.Length
}

foreach ($pngData in $pngDataList) {
    $bw.Write($pngData)
}

$bw.Dispose()
$fs.Dispose()

# Cleanup
foreach ($img in $images) { $img.Dispose() }

Write-Output "Icon created: $icoPath"
