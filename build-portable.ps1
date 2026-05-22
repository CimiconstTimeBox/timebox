$dir = "C:\Users\jmattar\.gemini\antigravity-ide\scratch\timebox-agenda"
$htmlPath = Join-Path $dir "index.html"
$cssPath = Join-Path $dir "style.css"
$jsPath = Join-Path $dir "app.js"
$imgPath = Join-Path $dir "logocimi.jpg"
$outputPath = Join-Path $dir "Timebox-Agenda-Portable.html"

# 1. Read files
$html = Get-Content $htmlPath -Raw -Encoding utf8
$css = Get-Content $cssPath -Raw -Encoding utf8
$js = Get-Content $jsPath -Raw -Encoding utf8

# 2. Base64 encode the logo image
$imgBytes = [System.IO.File]::ReadAllBytes($imgPath)
$imgBase64 = [System.Convert]::ToBase64String($imgBytes)
$imgDataUrl = "data:image/jpeg;base64,$imgBase64"

# 3. Replace the logo src in HTML
$html = $html -replace 'src="logocimi.jpg"', "src=`"$imgDataUrl`""

# 4. Inline CSS (replace <link rel="stylesheet" href="style.css"> with <style>...</style>)
$html = $html -replace '<link rel="stylesheet" href="style.css">', "<style>`n$css`n</style>"

# 5. Inline JS (replace <script src="app.js"></script> with <script>...</script>)
$html = $html -replace '<script src="app.js"></script>', "<script>`n$js`n</script>"

# 6. Save final bundled HTML file
[System.IO.File]::WriteAllText($outputPath, $html, [System.Text.Encoding]::UTF8)

Write-Host "Portable HTML compiled successfully!"
