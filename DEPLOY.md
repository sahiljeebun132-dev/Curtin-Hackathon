# Deploying VELA · ARIA

## The one-click button

After the one-time setup below, **double-click `deploy.bat`** (Windows) or run `./deploy.sh` (macOS/Linux) any time you change the code. It commits, pushes to GitHub, and Vercel automatically builds and re-deploys the live site.

---

## First-time setup (do this once)

### 1. Publish to GitHub
Double-click **`deploy.bat`**. The first run will:
- initialise git,
- link the remote `https://github.com/sahiljeebun132-dev/Curtin-Hackathon.git`,
- commit and push.

A GitHub sign-in window may pop up the first time — sign in, then double-click `deploy.bat` again.

### 2. Connect the repo to Vercel (global hosting)
1. Go to **https://vercel.com/new**
2. Click **Import** next to the `Curtin-Hackathon` repository
3. Vercel auto-detects the settings from `vercel.json` (framework **Vite**, build `npm run build`, output `dist/`)
4. Click **Deploy**

Vercel gives you a global URL like `https://curtin-hackathon.vercel.app`.

### Done
From now on, every `deploy.bat` push auto-builds and deploys worldwide. That's your one-click deploy.

---

## What `vercel.json` does
Tells Vercel this is a Vite app (`npm run build` → `dist/`) and rewrites all routes to `index.html` so the single-page app works on every URL.

## Note on the camera
The webcam emotion feature needs HTTPS — which Vercel provides automatically. It will work on the live Vercel URL even though `file://` opening won't allow the camera.
