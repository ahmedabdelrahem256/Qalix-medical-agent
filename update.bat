[IO.File]::WriteAllText('update.bat', (Get-Clipboard -Raw), [Text.Encoding]::UTF8); .\update.bat
