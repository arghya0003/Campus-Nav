# 🔒 Safe GitHub Upload Guide

## ✅ Pre-Upload Checklist

Before pushing to GitHub, verify these items:

- [ ] New API key generated and old one deleted from Google Cloud Console
- [ ] `backend/.env` updated with NEW API key
- [ ] `frontend/.env` updated (if exists)
- [ ] Git history cleaned (see SECURITY_CLEANUP.md)
- [ ] `.gitignore` is properly configured (already done ✅)

## 🔍 Final Security Check

Run these commands to ensure nothing sensitive will be uploaded:

```bash
# 1. Check what files will be committed (should NOT include .env files)
git status

# 2. Verify .env files are ignored
git check-ignore -v backend/.env frontend/.env
# Should show: .gitignore:14:.env

# 3. Search for any API keys in tracked files (should return nothing)
git grep -i "AIzaSy"

# 4. Check what will be pushed
git diff origin/main
```

## 📤 Safe Upload Steps

### Step 1: Prepare Your Commit

```bash
# Add the new files (safe files only)
git add .gitignore
git add README.md
git add SETUP.md
git add BACKEND_IMPLEMENTATION.md
git add SECURITY_CLEANUP.md
git add backend/
git add frontend/

# Check what's staged (VERIFY NO .env FILES!)
git status

# If you see .env files, remove them:
git reset backend/.env frontend/.env
```

### Step 2: Commit Your Changes

```bash
git commit -m "Add secure backend API proxy

- Move Google Maps API key to backend server
- Create Express server with proxy endpoints
- Update frontend to call backend instead of direct API
- Add comprehensive security with .gitignore
- Secure API key never exposed to client

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

### Step 3: Create GitHub Repository

Two options:

**Option A: New Repository (Recommended)**

1. Go to https://github.com/new
2. Create a new repository named `CampusNav` (or your choice)
3. **IMPORTANT:** Set as **Private** initially
4. Do NOT initialize with README (you already have one)

**Option B: Use Existing Repository**

If you already have a GitHub repo for this project, continue to Step 4.

### Step 4: Connect and Push

```bash
# If NEW repository, connect it:
git remote add origin https://github.com/YOUR_USERNAME/CampusNav.git

# If using existing repository, pull first:
git pull origin main --allow-unrelated-histories

# Push your secure code
git push -u origin main

# If you cleaned git history, you'll need to force push:
git push -u origin main --force
```

## 🎯 What Gets Uploaded (Safe ✅)

These files WILL be uploaded (and are safe):
- `.gitignore` - Protects your secrets ✅
- `backend/.env.example` - Just a template ✅
- `backend/server.js` - No secrets ✅
- `backend/routes/*` - No secrets ✅
- `frontend/src/*` - No secrets ✅
- `README.md`, `SETUP.md` - Documentation ✅

## 🚫 What's Protected (Won't Upload)

These files will NOT be uploaded (protected by .gitignore):
- `backend/.env` - Your actual API key 🔒
- `frontend/.env` - API URL configuration 🔒
- `node_modules/` - Dependencies 🔒
- `.env` - Any environment files 🔒

## 👥 Sharing with Collaborators

When others clone your repository, they need to:

1. Clone the repo:
```bash
git clone https://github.com/YOUR_USERNAME/CampusNav.git
cd CampusNav
```

2. Create their own `.env` files:
```bash
# Backend setup
cd backend
cp .env.example .env
# Edit .env and add THEIR Google Maps API key
npm install

# Frontend setup
cd ../frontend
cp .env.example .env
# Edit .env (usually just the default API URL)
npm install
```

3. Start both servers:
```bash
# Terminal 1
cd backend && npm start

# Terminal 2
cd frontend && npm run dev
```

## 🔐 Additional Security Tips

1. **GitHub Repository Settings:**
   - Keep your repo **Private** if possible
   - Enable **branch protection** on main branch
   - Add `.env` to repository secrets for GitHub Actions (if using CI/CD)

2. **Google Cloud API Key Restrictions:**
   - Add **Application restrictions** (HTTP referrers for your domain)
   - Add **API restrictions** (only enable Maps, Directions, Places, Geocoding)
   - Set **Usage quotas** to prevent abuse

3. **Regular Audits:**
   ```bash
   # Periodically check for secrets
   git log --all -S "AIzaSy" --oneline
   ```

4. **Use Git Hooks (Optional):**
   Create `.git/hooks/pre-commit`:
   ```bash
   #!/bin/bash
   if git diff --cached | grep -i "AIzaSy"; then
       echo "⛔ Error: API key detected in commit!"
       exit 1
   fi
   ```

## ✅ Verification After Upload

After pushing to GitHub:

1. Go to your GitHub repository in a browser
2. Verify these files are **NOT** visible:
   - `backend/.env`
   - `frontend/.env`
3. Verify these files **ARE** visible:
   - `backend/.env.example`
   - `frontend/.env.example`
   - All source code files

## 🆘 If You Accidentally Expose Secrets

If you accidentally commit and push secrets:

1. **Immediately** rotate the API key in Google Cloud Console
2. Use `git revert` or rewrite history (see SECURITY_CLEANUP.md)
3. Force push the cleaned history: `git push origin main --force`
4. Check GitHub's "Security" tab for exposed secrets alerts

## 📝 Summary

✅ Your `.gitignore` is properly configured
✅ API keys are in `.env` files (not tracked by git)
✅ Backend securely stores and proxies API calls
✅ Only safe files will be uploaded to GitHub

You're all set for a secure upload! 🎉
