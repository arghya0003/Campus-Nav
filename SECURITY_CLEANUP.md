# Security Cleanup Guide

## Problem
Your API key was exposed in commit 1ac3508 in the file `frontend/.env.example`.

## Solution Options

### Option A: Clean Git History (Recommended if repo is private/not shared)

This will rewrite your git history to remove the API key completely:

```bash
# Install git-filter-repo (if not installed)
# On Windows with Git Bash, you might need to install Python first
pip install git-filter-repo

# OR use BFG Repo-Cleaner (easier alternative)
# Download from: https://reclaimtheweb.org/cto-wtf/bfg-repo-cleaner/

# Using BFG (simpler):
# 1. Download bfg.jar
# 2. Create a file called 'passwords.txt' with your old API key
echo "AIzaSyBa919q4SIAoIlck0pR_f4Sfv4DNPLBYT8" > passwords.txt

# 3. Run BFG to remove the API key from all history
java -jar bfg.jar --replace-text passwords.txt .

# 4. Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 5. Delete passwords.txt
rm passwords.txt
```

### Option B: Start Fresh (Easiest)

If you haven't pushed to GitHub yet, starting fresh is simplest:

```bash
# 1. Backup your current work
cp -r . ../CampusNav_backup

# 2. Remove git history
rm -rf .git

# 3. Initialize fresh git repository
git init
git add .
git commit -m "Initial commit: CampusNav with secure backend"

# 4. Connect to GitHub (see main instructions below)
```

### Option C: Accept and Invalidate (If already public)

If the repo is already public:

1. **Immediately regenerate the API key** in Google Cloud Console
2. **Delete the old key**
3. Commit the cleaned-up version (without the key)
4. Add a note in your README that the key has been rotated

The old key in history is now useless, and your new key is safe.

## Verification

After cleanup, verify no secrets remain:

```bash
# Search for the old API key in entire history
git log --all -S "AIzaSyBa919q4SIAoIlck0pR_f4Sfv4DNPLBYT8"

# Should return nothing!
```

## After Cleanup

Once history is clean:
1. Update `backend/.env` with your NEW API key
2. Follow the safe upload steps in README.md
3. Never commit `.env` files again (they're now in .gitignore ✅)
