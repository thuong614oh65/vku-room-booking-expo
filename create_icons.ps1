Add-Type -AssemblyName System.Drawing

function Create-VKUBookingIcon([int]$size, [string]$outPath) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # 1. Background Gradient (VKU Smart Campus Ocean Blue to Royal Navy)
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $c1 = [System.Drawing.ColorTranslator]::FromHtml('#0284c7')
    $c2 = [System.Drawing.ColorTranslator]::FromHtml('#0f172a')
    $brushBg = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, 45.0)

    $radius = [float]($size * 0.22)
    $pathBg = New-Object System.Drawing.Drawing2D.GraphicsPath
    $pathBg.AddArc([float]0, [float]0, [float]($radius * 2), [float]($radius * 2), [float]180, [float]90)
    $pathBg.AddArc([float]($size - $radius * 2), [float]0, [float]($radius * 2), [float]($radius * 2), [float]270, [float]90)
    $pathBg.AddArc([float]($size - $radius * 2), [float]($size - $radius * 2), [float]($radius * 2), [float]($radius * 2), [float]0, [float]90)
    $pathBg.AddArc([float]0, [float]($size - $radius * 2), [float]($radius * 2), [float]($radius * 2), [float]90, [float]90)
    $pathBg.CloseFigure()

    $g.FillPath($brushBg, $pathBg)

    # 2. Inner border glow
    $penBorder = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(65, 255, 255, 255), [float]($size * 0.02))
    $g.DrawPath($penBorder, $pathBg)

    # 3. White Calendar / Smart Room Pass Card
    $cbW = [float]($size * 0.64)
    $cbH = [float]($size * 0.62)
    $cbX = [float](($size - $cbW) / 2)
    $cbY = [float]($size * 0.15)
    $cbRadius = [float]($size * 0.075)

    $pathCb = New-Object System.Drawing.Drawing2D.GraphicsPath
    $pathCb.AddArc($cbX, $cbY, [float]($cbRadius * 2), [float]($cbRadius * 2), [float]180, [float]90)
    $pathCb.AddArc([float]($cbX + $cbW - $cbRadius * 2), $cbY, [float]($cbRadius * 2), [float]($cbRadius * 2), [float]270, [float]90)
    $pathCb.AddArc([float]($cbX + $cbW - $cbRadius * 2), [float]($cbY + $cbH - $cbRadius * 2), [float]($cbRadius * 2), [float]($cbRadius * 2), [float]0, [float]90)
    $pathCb.AddArc($cbX, [float]($cbY + $cbH - $cbRadius * 2), [float]($cbRadius * 2), [float]($cbRadius * 2), [float]90, [float]90)
    $pathCb.CloseFigure()

    # Card Shadow
    $brushShadow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(85, 0, 0, 0))
    $g.TranslateTransform(0, [float]($size * 0.025))
    $g.FillPath($brushShadow, $pathCb)
    $g.ResetTransform()

    # White Card Fill
    $brushCb = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $g.FillPath($brushCb, $pathCb)

    # 4. Calendar Header Bar on top of Card (Crimson / VKU Accent Blue)
    $hdrH = [float]($cbH * 0.24)
    $pathHdr = New-Object System.Drawing.Drawing2D.GraphicsPath
    $pathHdr.AddArc($cbX, $cbY, [float]($cbRadius * 2), [float]($cbRadius * 2), [float]180, [float]90)
    $pathHdr.AddArc([float]($cbX + $cbW - $cbRadius * 2), $cbY, [float]($cbRadius * 2), [float]($cbRadius * 2), [float]270, [float]90)
    $pathHdr.AddLine([float]($cbX + $cbW), [float]($cbY + $hdrH), $cbX, [float]($cbY + $hdrH))
    $pathHdr.CloseFigure()

    $brushHdr = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#0284c7'))
    $g.FillPath($brushHdr, $pathHdr)

    # Calendar Rings (Gold)
    $brushGold = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#f59e0b'))
    $ringW = [float]($size * 0.045)
    $ringH = [float]($size * 0.09)
    $ringY = [float]($cbY - ($ringH * 0.42))
    $g.FillRectangle($brushGold, [float]($cbX + ($cbW * 0.26)), $ringY, $ringW, $ringH)
    $g.FillRectangle($brushGold, [float]($cbX + ($cbW * 0.74) - $ringW), $ringY, $ringW, $ringH)

    # 5. Room Slot Grid (2x2 modern blocks inside card)
    $gridStartX = [float]($cbX + ($cbW * 0.14))
    $gridStartY = [float]($cbY + $hdrH + ($cbH * 0.08))
    $cellW = [float]($cbW * 0.32)
    $cellH = [float]($cbH * 0.14)
    $gapX = [float]($cbW * 0.08)
    $gapY = [float]($cbH * 0.06)

    $brushGreen = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#10b981'))
    $brushBlue = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#0ea5e9'))
    $brushAmber = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#f59e0b'))

    $g.FillRectangle($brushGreen, $gridStartX, $gridStartY, $cellW, $cellH)
    $g.FillRectangle($brushBlue, [float]($gridStartX + $cellW + $gapX), $gridStartY, $cellW, $cellH)
    $g.FillRectangle($brushAmber, $gridStartX, [float]($gridStartY + $cellH + $gapY), $cellW, $cellH)
    $g.FillRectangle($brushGreen, [float]($gridStartX + $cellW + $gapX), [float]($gridStartY + $cellH + $gapY), $cellW, $cellH)

    # 6. VKU Brand Title inside card
    $fontVku = New-Object System.Drawing.Font('Arial', [float]($size * 0.092), [System.Drawing.FontStyle]::Bold)
    $brushVku = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#0369a1'))
    $strFormat = New-Object System.Drawing.StringFormat
    $strFormat.Alignment = [System.Drawing.StringAlignment]::Center
    $g.DrawString('VKU', $fontVku, $brushVku, [float]($size / 2), [float]($cbY + ($cbH * 0.69)), $strFormat)

    # 7. Subtitle 'ROOM BOOKING' at bottom
    $fontSub = New-Object System.Drawing.Font('Arial', [float]($size * 0.048), [System.Drawing.FontStyle]::Bold)
    $brushSub = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $g.DrawString('ROOM BOOKING', $fontSub, $brushSub, [float]($size / 2), [float]($size * 0.855), $strFormat)

    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated: $outPath ($size x $size)"
}

Create-VKUBookingIcon 1024 'assets/icon.png'
Create-VKUBookingIcon 512  'assets/android-icon-foreground.png'
Create-VKUBookingIcon 192  'assets/favicon.png'
Create-VKUBookingIcon 512  'public/icons/icon-512.png'
Create-VKUBookingIcon 192  'public/icons/icon-192.png'
Create-VKUBookingIcon 180  'public/icons/apple-touch-icon.png'
Create-VKUBookingIcon 64   'public/favicon.ico'
