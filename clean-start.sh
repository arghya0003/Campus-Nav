#!/bin/bash
# Quick Clean Start Script
# This removes git history and starts fresh with a clean commit

echo "🧹 Starting fresh with clean git history..."

# 1. Backup current .git directory (just in case)
cp -r .git .git.backup
echo "✅ Backed up .git to .git.backup"

# 2. Remove git history
rm -rf .git
echo "✅ Removed git history"

# 3. Initialize fresh repository
git init
echo "✅ Initialized fresh git repository"

# 4. Add all files (except those in .gitignore)
git add .
echo "✅ Added files (excluding .env)"

# 5. Verify .env files are NOT staged
echo ""
echo "🔍 Checking staged files..."
if git status | grep -q "\.env$"; then
    echo "⚠️  WARNING: .env file detected in staged files!"
    echo "Run: git reset backend/.env frontend/.env"
    exit 1
else
    echo "✅ No .env files in staged files - SAFE!"
fi

# 6. Create initial commit
git commit -m "Initial commit: CampusNav with secure backend

- Campus navigation app for KIIT University
- React + Vite frontend with Google Maps integration
- Secure Express backend API proxy
- API key safely stored server-side
- Modern glassmorphism UI with dark theme

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"

echo ""
echo "✅ Clean repository created!"
echo ""
echo "📤 Next steps:"
echo "1. Regenerate your Google Maps API key"
echo "2. Update backend/.env with new key"
echo "3. Create GitHub repository at: https://github.com/new"
echo "4. Run: git remote add origin https://github.com/YOUR_USERNAME/CampusNav.git"
echo "5. Run: git push -u origin main"
echo ""
echo "🔒 Your old API key in git history is now gone!"
