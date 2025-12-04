# Setup Checklist - BlueMind Freediving

Use this checklist to ensure proper setup and deployment of the application.

## ✅ Initial Setup

### 1. Project Installation
- [ ] Clone repository: `git clone https://github.com/ahakem/bluemind-members.git`
- [ ] Navigate to directory: `cd bluemind-members`
- [ ] Install dependencies: `npm install`
- [ ] Verify installation: `npm run start` (should open on localhost:3000)

### 2. Firebase Project Setup
- [ ] Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
- [ ] Enable **Authentication** with Email/Password provider
- [ ] Enable **Firestore Database** in production mode
- [ ] Copy Firebase configuration from Project Settings

### 3. Environment Configuration
- [ ] Copy `.env.example` to `.env`: `cp .env.example .env`
- [ ] Fill in Firebase credentials in `.env`:
  - [ ] REACT_APP_FIREBASE_API_KEY
  - [ ] REACT_APP_FIREBASE_AUTH_DOMAIN
  - [ ] REACT_APP_FIREBASE_PROJECT_ID
  - [ ] REACT_APP_FIREBASE_STORAGE_BUCKET
  - [ ] REACT_APP_FIREBASE_MESSAGING_SENDER_ID
  - [ ] REACT_APP_FIREBASE_APP_ID

### 4. Firestore Security Rules
- [ ] Install Firebase CLI: `npm install -g firebase-tools`
- [ ] Login to Firebase: `firebase login`
- [ ] Initialize Firebase: `firebase init` (select Firestore only)
- [ ] Deploy security rules: `firebase deploy --only firestore:rules`
- [ ] Verify rules are active in Firebase Console

### 5. Initial Admin User
- [ ] Run app: `npm start`
- [ ] Register new user at `/register`
- [ ] Go to Firebase Console → Firestore Database → `users` collection
- [ ] Find your user document and edit:
  - [ ] Set `role` to `"admin"`
  - [ ] Set `approved` to `true`
- [ ] Go to `members` collection
- [ ] Create new document with same UID as user:
  ```json
  {
    "uid": "your-user-uid",
    "name": "Your Name",
    "email": "your@email.com",
    "membershipStatus": "active",
    "medicalCertificate": {
      "expiryDate": "2025-12-31",
      "status": "valid"
    },
    "personalBests": {},
    "certifications": [],
    "createdAt": "current-timestamp",
    "updatedAt": "current-timestamp"
  }
  ```

## ✅ Testing

### 6. Local Testing
- [ ] Test login with admin user
- [ ] Verify redirect to `/admin` dashboard
- [ ] Test member management (create, edit member)
- [ ] Test session management (create session)
- [ ] Test attendance tracking
- [ ] Test payment verification flow
- [ ] Logout and test member registration
- [ ] Approve new member as admin
- [ ] Test member panel features

### 7. Security Verification
- [ ] Try accessing `/admin` as member (should redirect)
- [ ] Try accessing `/member` as admin (should work if also has member role)
- [ ] Test unapproved user (should see pending approval page)
- [ ] Verify Firestore rules prevent unauthorized access

## ✅ Deployment

### 8. Pre-deployment Checklist
- [ ] Update `homepage` in `package.json` to your domain
- [ ] Test build locally: `npm run build`
- [ ] Verify build folder is created
- [ ] Test production build: `npx serve -s build`

### 9. GitHub Pages Setup
- [ ] Ensure code is pushed to GitHub
- [ ] Run deployment: `npm run deploy`
- [ ] Wait for deployment to complete (2-5 minutes)
- [ ] Go to GitHub repo → Settings → Pages
- [ ] Verify `gh-pages` branch is selected
- [ ] Add custom domain: `app.blumindfreediving.nl`
- [ ] Enable "Enforce HTTPS"

### 10. DNS Configuration
- [ ] Log in to domain provider (e.g., TransIP, Cloudflare)
- [ ] Add CNAME record:
  - Type: `CNAME`
  - Host: `app`
  - Value: `ahakem.github.io`
  - TTL: `3600`
- [ ] Wait for DNS propagation (5 mins - 48 hours)
- [ ] Check DNS: `nslookup app.blumindfreediving.nl`

### 11. Firebase Authorized Domains
- [ ] Go to Firebase Console → Authentication → Settings
- [ ] Click "Authorized domains"
- [ ] Add: `app.blumindfreediving.nl`
- [ ] Save changes

### 12. Post-deployment Testing
- [ ] Visit `https://app.blumindfreediving.nl`
- [ ] Verify app loads correctly
- [ ] Test login functionality
- [ ] Test Firebase connection
- [ ] Check all routes work (no 404s)
- [ ] Test on mobile devices
- [ ] Test on different browsers (Chrome, Firefox, Safari)

## ✅ Production Data Setup

### 13. Initial Data Population
- [ ] Create real member accounts
- [ ] Set up training session schedule
- [ ] Configure payment information (IBAN in MemberPayments.tsx)
- [ ] Create initial invoices for members
- [ ] Update medical certificates for all members
- [ ] Document admin procedures

### 14. Optional Enhancements
- [ ] Add Google Analytics (see DEPLOYMENT.md)
- [ ] Set up automated backups for Firestore
- [ ] Create monitoring alerts for Firebase usage
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Add email notifications for important events
- [ ] Create user documentation/help guide

## ✅ Maintenance

### 15. Regular Checks
- [ ] Weekly: Check for expired medical certificates
- [ ] Weekly: Verify pending payments
- [ ] Monthly: Review Firebase usage and costs
- [ ] Monthly: Update dependencies: `npm update`
- [ ] Quarterly: Review and update Firestore security rules
- [ ] Quarterly: Test backup restoration process

### 16. Before Each Update
- [ ] Test changes locally
- [ ] Create backup of Firestore data
- [ ] Document changes in commit message
- [ ] Deploy to GitHub Pages: `npm run deploy`
- [ ] Test deployed version
- [ ] Monitor for errors

## 🎯 Success Criteria

Your setup is complete when:
- ✅ Admin can log in and access admin panel
- ✅ Members can log in and access member panel
- ✅ Sessions can be created and booked
- ✅ Attendance can be tracked
- ✅ Payment flow works end-to-end
- ✅ App is accessible at custom domain
- ✅ HTTPS is enabled
- ✅ No console errors
- ✅ Mobile responsive

## 📞 Troubleshooting

If you encounter issues:

1. **Build Errors**: Delete `node_modules`, run `npm install` again
2. **Firebase Errors**: Check `.env` file, verify Firebase project is active
3. **Deployment 404s**: Ensure `CNAME` file exists in `public/` folder
4. **Auth Errors**: Add domain to Firebase authorized domains
5. **Data Access Errors**: Verify Firestore security rules are deployed

For more help, see:
- `README.md` - General documentation
- `DEPLOYMENT.md` - Detailed deployment guide
- Firebase docs - firebase.google.com/docs
- React docs - react.dev

---

**Good luck with your setup! 🌊**
