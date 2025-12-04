# Deployment Guide - BlueMind Freediving

This guide covers deploying the BlueMind Freediving application to GitHub Pages with a custom subdomain.

## Prerequisites

- GitHub account with repository access
- Custom domain (e.g., blumindfreediving.nl)
- Access to DNS settings
- Firebase project configured

## Step 1: Prepare the Repository

1. Ensure your code is pushed to GitHub:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. Verify `package.json` has the correct homepage:
```json
"homepage": "https://app.blumindfreediving.nl"
```

## Step 2: Install gh-pages

The `gh-pages` package is already in the dependencies. If not installed:
```bash
npm install --save-dev gh-pages
```

## Step 3: Build and Deploy

1. Build the production version:
```bash
npm run build
```

2. Deploy to GitHub Pages:
```bash
npm run deploy
```

This command:
- Builds the app
- Creates/updates the `gh-pages` branch
- Pushes the build to GitHub Pages

## Step 4: Configure GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Source", select `gh-pages` branch
4. Click **Save**

## Step 5: Set Up Custom Domain

### A. Add Custom Domain in GitHub

1. In GitHub Pages settings, find "Custom domain"
2. Enter: `app.blumindfreediving.nl`
3. Click **Save**
4. Check "Enforce HTTPS" (may take a few minutes to be available)

### B. Configure DNS Records

Add these DNS records at your domain provider:

**For subdomain (app.blumindfreediving.nl):**

```
Type: CNAME
Host: app
Value: ahakem.github.io
TTL: 3600 (or Auto)
```

**Alternative: If CNAME doesn't work, use A records:**

```
Type: A
Host: app
Value: 185.199.108.153
TTL: 3600

Type: A
Host: app
Value: 185.199.109.153
TTL: 3600

Type: A
Host: app
Value: 185.199.110.153
TTL: 3600

Type: A
Host: app
Value: 185.199.111.153
TTL: 3600
```

### C. Wait for DNS Propagation

DNS changes can take 5 minutes to 48 hours to propagate globally. Check status:
```bash
nslookup app.blumindfreediving.nl
```

## Step 6: Verify Deployment

1. Visit `https://app.blumindfreediving.nl`
2. Verify the app loads correctly
3. Test login functionality
4. Check Firebase connection

## Step 7: Update Firebase Configuration

### A. Add Authorized Domain

1. Go to Firebase Console
2. Navigate to **Authentication** → **Settings** → **Authorized domains**
3. Add: `app.blumindfreediving.nl`
4. Click **Add domain**

### B. Update CORS Settings (if needed)

If you encounter CORS issues:
1. Go to Firebase Console → **Firestore Database** → **Settings**
2. Ensure your domain is whitelisted

## Continuous Deployment

### Option 1: Manual Deployment

Whenever you make changes:
```bash
git add .
git commit -m "Description of changes"
git push origin main
npm run deploy
```

### Option 2: Automated with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          REACT_APP_FIREBASE_API_KEY: ${{ secrets.REACT_APP_FIREBASE_API_KEY }}
          REACT_APP_FIREBASE_AUTH_DOMAIN: ${{ secrets.REACT_APP_FIREBASE_AUTH_DOMAIN }}
          REACT_APP_FIREBASE_PROJECT_ID: ${{ secrets.REACT_APP_FIREBASE_PROJECT_ID }}
          REACT_APP_FIREBASE_STORAGE_BUCKET: ${{ secrets.REACT_APP_FIREBASE_STORAGE_BUCKET }}
          REACT_APP_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.REACT_APP_FIREBASE_MESSAGING_SENDER_ID }}
          REACT_APP_FIREBASE_APP_ID: ${{ secrets.REACT_APP_FIREBASE_APP_ID }}
          
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./build
          cname: app.blumindfreediving.nl
```

Then add Firebase secrets to GitHub:
1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add each Firebase config value

## Troubleshooting

### Issue: 404 on Page Refresh

**Solution**: Add a `404.html` that redirects to `index.html`

Create `public/404.html`:
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>BlueMind Freediving</title>
    <script type="text/javascript">
      var pathSegmentsToKeep = 0;
      var l = window.location;
      l.replace(
        l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
        l.pathname.split('/').slice(0, 1 + pathSegmentsToKeep).join('/') + '/?/' +
        l.pathname.slice(1).split('/').slice(pathSegmentsToKeep).join('/').replace(/&/g, '~and~') +
        (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
        l.hash
      );
    </script>
  </head>
  <body>
  </body>
</html>
```

### Issue: CNAME File Deleted on Deploy

**Solution**: Add CNAME to the `public` folder

Create `public/CNAME`:
```
app.blumindfreediving.nl
```

### Issue: Firebase Connection Failed

**Causes**:
1. Environment variables not set
2. Domain not authorized in Firebase
3. Incorrect Firebase config

**Solution**: 
- Verify `.env` variables
- Check Firebase Console → Authentication → Authorized domains
- Rebuild with `npm run build`

### Issue: Blank Page After Deployment

**Causes**:
1. Incorrect `homepage` in package.json
2. React Router basename not set
3. Build errors

**Solution**:
- Check browser console for errors
- Verify `homepage` matches your domain
- Clear browser cache
- Rebuild and redeploy

## Rollback

If deployment fails, rollback to previous version:

```bash
git checkout gh-pages
git reset --hard HEAD~1
git push origin gh-pages --force
```

## Monitoring

### Check Deployment Status
```bash
# View gh-pages branch
git checkout gh-pages
git log

# Return to main branch
git checkout main
```

### Analytics (Optional)

Add Google Analytics to track usage:
1. Get GA tracking ID
2. Add to `public/index.html`:
```html
<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_TRACKING_ID');
</script>
```

## Best Practices

1. **Always test locally before deploying**
```bash
npm start
```

2. **Use meaningful commit messages**
```bash
git commit -m "feat: Add payment verification feature"
```

3. **Keep dependencies updated**
```bash
npm outdated
npm update
```

4. **Monitor Firebase usage**
- Check Firebase Console → Usage
- Set budget alerts

5. **Backup Firestore data regularly**
```bash
firebase firestore:export gs://your-bucket/backups/$(date +%Y%m%d)
```

## Support

For deployment issues:
- Check GitHub Pages status: https://www.githubstatus.com/
- Firebase status: https://status.firebase.google.com/
- Contact development team

---

**Happy Deploying! 🚀**
