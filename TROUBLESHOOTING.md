# Troubleshooting Guide - BlueMind Freediving

Common issues and their solutions.

## 🔥 Firebase Issues

### Error: "Firebase: Error (auth/configuration-not-found)"

**Cause**: Firebase configuration not properly set in `.env`

**Solution**:
1. Check `.env` file exists in project root
2. Verify all Firebase credentials are correct
3. Restart development server: `npm start`
4. Check for typos in environment variable names

```bash
# Verify environment variables are loaded
console.log(process.env.REACT_APP_FIREBASE_PROJECT_ID);
```

### Error: "Missing or insufficient permissions"

**Cause**: Firestore security rules not deployed or user not authorized

**Solution**:
1. Deploy security rules: `firebase deploy --only firestore:rules`
2. Check user's role and approved status in Firestore Console
3. Verify rules in Firebase Console → Firestore → Rules tab
4. Check browser console for detailed error message

### Error: "Firebase: Firebase App named '[DEFAULT]' already exists"

**Cause**: Firebase initialized multiple times

**Solution**:
1. Check `src/config/firebase.ts` is only imported once
2. Ensure no duplicate Firebase initialization
3. Clear browser cache and restart

### Error: "Access to Firestore from origin has been blocked by CORS"

**Cause**: Domain not authorized in Firebase

**Solution**:
1. Go to Firebase Console → Authentication → Settings
2. Add your domain to "Authorized domains"
3. For local dev, `localhost` should be there by default
4. For production, add `app.blumindfreediving.nl`

## 🔐 Authentication Issues

### Cannot Login - "Wrong password" Error

**Solution**:
1. Reset password using Firebase Console
2. Or create new user via Register page
3. Check Firestore Console that user has `approved: true`

### Stuck on "Pending Approval" Page

**Solution**:
1. Go to Firebase Console → Firestore → `users` collection
2. Find your user document
3. Set `approved: true`
4. Logout and login again

### User Logs In But Sees Blank Page

**Cause**: User missing member document or role mismatch

**Solution**:
1. Check `members` collection has document with matching UID
2. Verify user has correct role in `users` collection
3. Check browser console for errors
4. Verify routes in `App.tsx` match user's role

### Infinite Redirect Loop

**Cause**: Protected route logic or role check failing

**Solution**:
1. Check `ProtectedRoute.tsx` logic
2. Verify `userData` is loaded in `AuthContext`
3. Add console logs to debug auth state:
```typescript
console.log('currentUser:', currentUser);
console.log('userData:', userData);
console.log('loading:', loading);
```

## 🌐 Deployment Issues

### GitHub Pages Shows 404

**Cause**: Missing `404.html` or CNAME configuration

**Solution**:
1. Verify `public/404.html` exists
2. Verify `public/CNAME` contains: `app.blumindfreediving.nl`
3. Rebuild and redeploy: `npm run deploy`
4. Check GitHub repo → Settings → Pages for errors

### Blank Page After Deployment

**Cause**: Incorrect `homepage` in `package.json` or build errors

**Solution**:
1. Check `homepage` in `package.json`:
```json
"homepage": "https://app.blumindfreediving.nl"
```
2. Check for build errors: `npm run build`
3. Test locally: `npx serve -s build`
4. Check browser console for errors
5. Clear browser cache (Ctrl+Shift+Delete)

### CSS Not Loading After Deploy

**Cause**: Asset path issues

**Solution**:
1. Verify `homepage` in `package.json` is correct
2. Check `BrowserRouter` has `basename` if using subdirectory
3. Clear browser cache
4. Check Network tab in DevTools for 404s

### Custom Domain Not Working

**Cause**: DNS not configured or not propagated

**Solution**:
1. Check DNS records are correct:
```bash
nslookup app.blumindfreediving.nl
```
2. Wait for DNS propagation (up to 48 hours)
3. Check CNAME points to: `ahakem.github.io`
4. Verify `CNAME` file in `public/` folder
5. Check GitHub Pages settings

## 📱 UI/UX Issues

### Material-UI Components Not Styling Correctly

**Cause**: Theme not applied or CSS conflicts

**Solution**:
1. Verify `ThemeProvider` wraps entire app in `App.tsx`
2. Check `CssBaseline` is included
3. Clear browser cache
4. Check for CSS import order issues

### Data Grid Not Displaying

**Cause**: Missing data or incorrect row ID

**Solution**:
1. Check data is being fetched: `console.log(rows)`
2. Verify `getRowId` prop is set correctly
3. Check for TypeScript errors
4. Ensure DataGrid has explicit height:
```tsx
<Box sx={{ height: 600, width: '100%' }}>
  <DataGrid rows={data} columns={columns} />
</Box>
```

### Mobile Menu Not Working

**Cause**: Drawer component state issue

**Solution**:
1. Check `mobileOpen` state in Layout components
2. Verify `handleDrawerToggle` is connected
3. Test on actual mobile device, not just browser resize

### Dates Not Displaying Correctly

**Cause**: Firestore Timestamp not converted to Date

**Solution**:
```typescript
// Convert Timestamp to Date:
const data = {
  ...doc.data(),
  date: doc.data().date?.toDate()
};
```

## 💾 Data Issues

### Data Not Saving to Firestore

**Cause**: Security rules blocking write or incorrect data format

**Solution**:
1. Check browser console for Firestore errors
2. Test security rules in Firebase Console Rules Playground
3. Verify user has correct role and permissions
4. Check data structure matches Firestore rules
5. Verify Timestamp format:
```typescript
import { Timestamp } from 'firebase/firestore';
const date = Timestamp.fromDate(new Date());
```

### Data Not Loading

**Cause**: Query error or security rules blocking read

**Solution**:
1. Check browser console for errors
2. Verify collection names are correct
3. Test query in Firebase Console
4. Check security rules allow read access
5. Add error handling:
```typescript
try {
  const snapshot = await getDocs(query);
  console.log('Data loaded:', snapshot.size);
} catch (error) {
  console.error('Error loading data:', error);
}
```

### Real-time Updates Not Working

**Cause**: Using `getDocs` instead of `onSnapshot`

**Solution**:
Implement real-time listener:
```typescript
useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(db, 'sessions'),
    (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSessions(data);
    }
  );
  return () => unsubscribe();
}, []);
```

## 🐛 Build/Compile Errors

### TypeScript Errors

**Solution**:
1. Check for type mismatches
2. Add proper type annotations
3. Fix missing imports
4. Use `any` as temporary workaround (not recommended)

### Module Not Found Error

**Solution**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install

# Clear npm cache
npm cache clean --force
```

### Dependency Conflicts

**Solution**:
```bash
# Check for conflicting versions
npm ls [package-name]

# Fix with legacy peer deps
npm install --legacy-peer-deps
```

## 📧 Payment Issues

### Payment Reference Not Displaying

**Cause**: Reference not generated or not saved

**Solution**:
1. Check invoice has `uniquePaymentReference` field
2. Verify generation in `generatePaymentReference()` utility
3. Ensure field is saved when creating invoice

### Payment Status Not Updating

**Cause**: Security rules blocking update or incorrect status transition

**Solution**:
1. Check Firestore security rules allow status update
2. Verify transition is valid (pending → transfer_initiated → paid)
3. Check browser console for errors
4. Test in Firebase Console directly

## 🔄 Performance Issues

### App Loading Slowly

**Solution**:
1. Implement code splitting:
```typescript
const AdminPanel = lazy(() => import('./pages/admin/AdminLayout'));
```
2. Use `React.memo()` for expensive components
3. Optimize Firestore queries with indexes
4. Enable Firebase caching

### Too Many Firestore Reads

**Solution**:
1. Use `onSnapshot` instead of polling with `getDocs`
2. Implement pagination in DataGrid
3. Cache frequently accessed data
4. Use Firestore indexes for complex queries

## 🔍 Debug Mode

### Enable Verbose Logging

Add to `src/config/firebase.ts`:
```typescript
import { enableIndexedDbPersistence } from 'firebase/firestore';

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Browser doesn\'t support offline');
  }
});
```

### React DevTools

1. Install React DevTools browser extension
2. Open DevTools → Components tab
3. Inspect component props and state
4. Use Profiler to identify performance issues

### Firebase Emulator

```bash
# Run Firestore locally
firebase emulators:start --only firestore

# Update firebase.ts to use emulator
if (window.location.hostname === 'localhost') {
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

## 📞 Getting Help

### Check Logs

1. **Browser Console**: F12 → Console tab
2. **Network Tab**: Check API requests/responses
3. **Firebase Console**: Check usage and errors
4. **GitHub Actions**: Check deployment logs

### Search Error Messages

1. Copy exact error message
2. Search on:
   - Stack Overflow
   - Firebase documentation
   - React documentation
   - GitHub issues

### Report Bug

When reporting issues, include:
- Error message (full text)
- Browser and version
- Steps to reproduce
- Screenshots if relevant
- Console output
- Firebase project ID (for Firebase issues)

## 🆘 Emergency Recovery

### Rollback Deployment

```bash
# Rollback gh-pages to previous version
git checkout gh-pages
git reset --hard HEAD~1
git push origin gh-pages --force
```

### Restore Firestore Data

```bash
# If you have backups
firebase firestore:import gs://your-bucket/backups/20241204
```

### Reset Local Environment

```bash
# Nuclear option - start fresh
rm -rf node_modules package-lock.json
npm install
npm start
```

---

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Material-UI Documentation](https://mui.com)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Router Documentation](https://reactrouter.com)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

---

**Still stuck? Check README.md or contact support** 🆘
