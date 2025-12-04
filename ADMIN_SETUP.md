# Admin User Setup Guide

## Prerequisites

Before creating your first admin user, ensure:

1. ✅ Firebase project is created
2. ✅ `.env` file is configured with Firebase credentials
3. ✅ **Email/Password authentication is enabled** in Firebase Console

## Step 1: Enable Email/Password Authentication

**This is required to fix the "auth/operation-not-allowed" error**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Sign-in method** tab
4. Click on **Email/Password** provider
5. **Enable** the first toggle (Email/Password)
6. Click **Save**

## Step 2: Create Your First Admin User

### Method 1: Register + Manual Promotion (Easiest)

1. **Register normally** in your app:
   - Go to `/register` in your application
   - Fill in your details and create an account
   - You'll see "Pending Approval" page

2. **Promote to admin** via Firebase Console:
   - Go to Firebase Console → Firestore Database
   - Find the `users` collection
   - Locate your user document (use your email to find it)
   - Click **Edit** and modify:
     ```
     role: "admin"
     approved: true
     ```
   - Save changes

3. **Refresh your app** - You now have admin access!

### Method 2: Using Admin Creation Script (Advanced)

If you have Firebase Admin SDK access:

1. **Install Firebase Admin SDK:**
   ```bash
   npm install firebase-admin
   ```

2. **Get Service Account Key:**
   - Go to Firebase Console
   - Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `serviceAccountKey.json` in project root
   - ⚠️ **Important:** Add to `.gitignore` (already included)

3. **Run the script:**
   ```bash
   node create-admin.js
   ```

4. **Follow the prompts:**
   - Enter admin email
   - Enter password (minimum 6 characters)
   - Enter full name

5. **Login** with the credentials you just created

## Step 3: Verify Admin Access

After creating your admin user:

1. Login to the application
2. You should see the **Admin Panel** in the navigation
3. Verify you can access:
   - `/admin/dashboard`
   - `/admin/members`
   - `/admin/sessions`
   - `/admin/attendance`
   - `/admin/payments`

## Troubleshooting

### "auth/operation-not-allowed"
- ✅ **Solution:** Enable Email/Password authentication (see Step 1)

### "Pending Approval" after login
- ✅ **Solution:** Set `approved: true` in your user document (Firestore Console)

### Not seeing Admin Panel
- ✅ **Solution:** Set `role: "admin"` in your user document (Firestore Console)

### "Permission denied" errors
- ✅ **Solution:** Deploy Firestore rules:
  ```bash
  firebase deploy --only firestore:rules
  ```

## Security Recommendations

1. **Use a strong password** for admin accounts
2. **Never commit** `serviceAccountKey.json` to git
3. **Delete** `create-admin.js` and `serviceAccountKey.json` after creating your admin user
4. **Limit admin access** - only create admin accounts for trusted users
5. **Monitor admin activity** through Firestore audit logs

## Next Steps

Once your admin user is set up:

1. ✅ Deploy Firestore security rules: `firebase deploy --only firestore:rules`
2. ✅ Create additional members through the Admin Panel
3. ✅ Set up training sessions
4. ✅ Configure payment settings
5. ✅ Review and customize the application

---

**Need help?** Check `TROUBLESHOOTING.md` for common issues and solutions.
