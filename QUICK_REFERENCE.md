# Quick Reference Guide - BlueMind Freediving

Common tasks and code snippets for maintaining the application.

## 🔐 User Management

### Create Admin User Manually (Firestore Console)
```javascript
// In 'users' collection, add/edit document:
{
  uid: "firebase-user-uid",
  email: "admin@blumindfreediving.nl",
  name: "Admin Name",
  role: "admin",  // or "coach"
  approved: true,
  createdAt: Timestamp.now()
}

// In 'members' collection, create matching document with same UID
{
  uid: "firebase-user-uid",
  name: "Admin Name",
  email: "admin@blumindfreediving.nl",
  membershipStatus: "active",
  medicalCertificate: {
    expiryDate: Timestamp.fromDate(new Date('2025-12-31')),
    status: "valid"
  },
  personalBests: {},
  certifications: [],
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
}
```

### Approve Pending User
1. Go to Firebase Console → Firestore
2. Find user in `users` collection
3. Edit document, set `approved: true`

## 💰 Invoice Management

### Create Invoice Manually
```javascript
// In 'invoices' collection, add document:
{
  memberId: "member-uid",
  memberName: "Member Name",
  memberEmail: "member@email.com",
  amount: 250,
  currency: "EUR",
  status: "pending",
  uniquePaymentReference: "BM-2024-001-ABC123",
  description: "Annual Membership 2025",
  dueDate: Timestamp.fromDate(new Date('2025-01-31')),
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
}
```

### Generate Payment Reference
Use the utility function:
```typescript
import { generatePaymentReference } from './utils/helpers';
const reference = generatePaymentReference();
// Returns: "BM-2024-XXX-RANDOM"
```

## 📅 Session Management

### Create Session Manually
```javascript
// In 'sessions' collection, add document:
{
  date: Timestamp.fromDate(new Date('2024-12-15')),
  startTime: "19:00",
  endTime: "21:00",
  location: "Sloterparkbad, Amsterdam",
  type: "pool",  // or "open_water", "theory", "competition"
  capacity: 12,
  currentAttendance: 0,
  description: "Pool training session",
  createdBy: "admin-uid",
  createdAt: Timestamp.now()
}
```

## 🏊 Personal Bests

### Update Member PBs
```javascript
// In 'members' collection, update document:
{
  personalBests: {
    STA: 240,  // Static Apnea in seconds (4:00)
    DYN: 75,   // Dynamic with fins in meters
    DNF: 50,   // Dynamic no fins in meters
    CWT: 30    // Constant Weight in meters
  },
  updatedAt: Timestamp.now()
}
```

## 🔧 Configuration Updates

### Update Payment Info
Edit `src/pages/member/MemberPayments.tsx`:
```typescript
const paymentInfo: PaymentInfo = {
  iban: 'NL91ABNA0417164300',
  bankName: 'ABN AMRO',
  accountHolder: 'BlueMind Freediving',
};
```

### Update Theme Colors
Edit `src/theme/theme.ts`:
```typescript
palette: {
  primary: {
    main: '#0A4D68',  // Your primary color
  },
  secondary: {
    main: '#00A9A5',  // Your secondary color
  },
}
```

### Update Homepage URL
Edit `package.json`:
```json
{
  "homepage": "https://app.blumindfreediving.nl"
}
```

## 🚀 Deployment Commands

```bash
# Local development
npm start

# Build for production
npm run build

# Test production build locally
npx serve -s build

# Deploy to GitHub Pages
npm run deploy

# Check deployment
git checkout gh-pages
git log
git checkout main
```

## 🔒 Firestore Security Rules

### Test Rules Locally
```bash
# Install emulator
npm install -g firebase-tools

# Start emulator
firebase emulators:start --only firestore

# Run your app against emulator
# Set in firebase.ts: connectFirestoreEmulator(db, 'localhost', 8080);
```

### Deploy Rules
```bash
firebase deploy --only firestore:rules
```

## 📊 Common Queries

### Get All Active Members
```typescript
const activeMembers = query(
  collection(db, 'members'),
  where('membershipStatus', '==', 'active')
);
const snapshot = await getDocs(activeMembers);
```

### Get Upcoming Sessions
```typescript
const upcomingSessions = query(
  collection(db, 'sessions'),
  where('date', '>=', Timestamp.now()),
  orderBy('date', 'asc')
);
const snapshot = await getDocs(upcomingSessions);
```

### Get Member's Pending Invoices
```typescript
const pendingInvoices = query(
  collection(db, 'invoices'),
  where('memberId', '==', userId),
  where('status', 'in', ['pending', 'transfer_initiated'])
);
const snapshot = await getDocs(pendingInvoices);
```

## 🐛 Debug Commands

### Check Firebase Connection
```typescript
// Add to any component:
useEffect(() => {
  console.log('Firebase config:', {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY?.substring(0, 10) + '...',
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  });
}, []);
```

### Check Current User
```typescript
// Add to any component:
const { currentUser, userData } = useAuth();
useEffect(() => {
  console.log('Current user:', currentUser?.uid);
  console.log('User data:', userData);
}, [currentUser, userData]);
```

### View Firestore Data
```typescript
// Temporary debug component:
useEffect(() => {
  const fetchData = async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    snapshot.forEach(doc => {
      console.log(doc.id, doc.data());
    });
  };
  fetchData();
}, []);
```

## 📦 Update Dependencies

```bash
# Check outdated packages
npm outdated

# Update all to latest (within semver)
npm update

# Update specific package
npm install react@latest

# Update major versions
npm install react@latest react-dom@latest

# Audit security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

## 🔄 Backup & Restore

### Backup Firestore
```bash
# Export all collections
firebase firestore:export gs://your-bucket/backups/$(date +%Y%m%d)

# Export specific collection
firebase firestore:export --collection-ids=members gs://your-bucket/backups/members
```

### Restore Firestore
```bash
firebase firestore:import gs://your-bucket/backups/20241204
```

## 🌐 DNS Configuration

### CNAME Record
```
Type: CNAME
Host: app
Value: ahakem.github.io
TTL: 3600
```

### Check DNS Propagation
```bash
# Check CNAME
nslookup app.blumindfreediving.nl

# Check globally
dig app.blumindfreediving.nl

# Online tool
# https://dnschecker.org
```

## 📧 Add Feature: Email Notifications

To add email notifications, you'll need Firebase Functions:

```bash
# Initialize functions
firebase init functions

# Install packages
cd functions
npm install nodemailer

# Create function
# functions/src/index.ts:
export const sendEmail = functions.firestore
  .document('invoices/{invoiceId}')
  .onCreate(async (snap, context) => {
    const invoice = snap.data();
    // Send email logic here
  });

# Deploy
firebase deploy --only functions
```

## 🎨 Custom Components

### Create New Page
1. Create file in `src/pages/` or `src/pages/admin/` or `src/pages/member/`
2. Import and add route in `src/App.tsx`
3. Add to sidebar menu in respective Layout component

Example:
```typescript
// src/pages/admin/Reports.tsx
import React from 'react';
import { Box, Typography } from '@mui/material';

const Reports: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4">Reports</Typography>
      {/* Your content */}
    </Box>
  );
};

export default Reports;
```

## 💡 Tips & Tricks

### Clear Browser Cache
```javascript
// Add to any page:
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => registration.unregister());
  });
}
```

### Force Re-render
```typescript
const [key, setKey] = useState(0);
// In component: key={key}
// To force update: setKey(prev => prev + 1)
```

### Debug Firestore Rules
Enable debug mode in Firebase Console:
1. Firestore → Rules
2. Click "Rules Playground"
3. Test read/write operations

## 📱 PWA Features (Optional)

To make it a Progressive Web App:

1. Update `public/manifest.json`:
```json
{
  "short_name": "BlueMind",
  "name": "BlueMind Freediving",
  "icons": [
    {
      "src": "logo192.png",
      "type": "image/png",
      "sizes": "192x192"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#0A4D68",
  "background_color": "#ffffff"
}
```

2. Add service worker in `src/index.tsx`:
```typescript
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
serviceWorkerRegistration.register();
```

---

**Quick Reference Complete!** 📚

For more details, see:
- `README.md` - Full documentation
- `DEPLOYMENT.md` - Deployment guide
- `SETUP_CHECKLIST.md` - Setup steps
