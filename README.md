# Tally: plain-talk money coach

A static web app that reads your expenses and tells you, in plain words, where your money is going. Runs entirely in the browser. Data is stored in localStorage and never leaves your device.

## Deploy on GitHub Pages
1. Create a new public repository on GitHub.
2. Upload index.html, style.css, app.js and README.md to the repository root.
3. Settings > Pages > Source: "Deploy from a branch", Branch: main, Folder: /(root). Save.
4. Open https://YOUR-USERNAME.github.io/REPO-NAME/ after a minute or two.

## CSV format for import
First row must contain headers: date, amount, and optionally description and category.
Example: date,description,amount
2026-09-14,Swiggy dinner,450
