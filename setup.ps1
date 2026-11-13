# One-time Windows setup for Frankie Feathers.
# Run from this folder in PowerShell:  powershell -ExecutionPolicy Bypass -File .\setup.ps1

Write-Host "Installing FFmpeg (Gyan.FFmpeg) via winget..."
winget install --id Gyan.FFmpeg -e --accept-package-agreements --accept-source-agreements

Write-Host "Installing npm packages..."
npm install

Write-Host ""
Write-Host "Setup complete."
Write-Host "1. Paste your ElevenLabs API key into .env  (ELEVENLABS_API_KEY=...)"
Write-Host "2. Drop scene.jpg (1080x1920) into this folder"
Write-Host "3. Close and reopen this terminal so ffmpeg is on PATH, then run:"
Write-Host "     node render_episode.js"
