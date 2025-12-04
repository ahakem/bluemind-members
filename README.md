# BlueMind Freediving - Club Management System

A serverless, single-page application (SPA) for managing BlueMind Freediving club memberships, sessions, and payments. Built with React, Material-UI, and Firebase.

## 🌊 Features

### Admin Panel
- **Member Management**: View and manage member profiles, certifications, and medical certificates
- **Session Scheduling**: Create and manage training sessions with calendar view
- **Attendance Tracking**: Mark member attendance for completed sessions
- **Payment Verification**: Manually verify bank transfers and activate memberships

### Member Panel
- **Dashboard**: View membership status, medical certificate expiry, and next session
- **Session Booking**: Browse and book upcoming training sessions
- **Payment Management**: Initiate bank transfers and track invoice status
- **Personal Bests**: View freediving performance records (STA, DYN, DNF, CWT)

## 🚀 Tech Stack

- **Frontend**: React 18 with TypeScript
- **UI Framework**: Material-UI (MUI) v5
- **Routing**: React Router v6
- **Backend**: Firebase (Authentication + Firestore)
- **Deployment**: GitHub Pages

## 📋 Prerequisites

Before you begin, ensure you have:
- Node.js (v16 or higher)
- npm or yarn
- A Firebase project
- Git

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/ahakem/bluemind-members.git
cd bluemind-members
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing project
3. Enable **Authentication** with Email/Password provider
4. Enable **Firestore Database**
5. Get your Firebase configuration from Project Settings

### 4. Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and add your Firebase configuration:
```env
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 5. Deploy Firestore Security Rules

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase in your project:
```bash
firebase init
```
- Select **Firestore**
- Choose your Firebase project
- Use `firestore.rules` for security rules
- Skip Firestore indexes for now

4. Deploy the security rules:
```bash
firebase deploy --only firestore:rules
```

### 6. Create Initial Admin User

Since the app uses role-based access, you need to create an admin user manually:

1. Run the app locally: `npm start`
2. Register a new user through the registration page
3. Go to Firebase Console → Firestore Database
4. Find the user document in the `users` collection
5. Edit the document and set:
   - `role`: `"admin"`
   - `approved`: `true`
6. Create a corresponding member document in the `members` collection with the same UID

### 7. Run the Application

```bash
npm start
```

The app will open at `http://localhost:3000`

## 🌐 Deployment to GitHub Pages

### 1. Update package.json

Ensure the `homepage` field in `package.json` is set to your GitHub Pages URL:
```json
"homepage": "https://app.blumindfreediving.nl"
```

### 2. Build and Deploy

```bash
npm run deploy
```

This will:
1. Build the production version
2. Deploy to the `gh-pages` branch
3. Make the app available at your specified URL

### 3. Configure Custom Domain (Optional)

If using a custom subdomain like `app.blumindfreediving.nl`:

1. Go to your GitHub repository settings
2. Navigate to Pages section
3. Add your custom domain
4. Create a CNAME record in your DNS settings pointing to `<username>.github.io`

## 🔒 Security

### Firestore Security Rules

The application uses comprehensive Firestore security rules that enforce:
- Role-based access control (admin, coach, member)
- User data isolation (members can only see their own data)
- Proper authentication checks on all operations
- Restricted write operations (only admins can modify critical data)

### Authentication Flow

1. Users register via the registration page
2. New users have `approved: false` and `role: 'member'`
3. Admin must approve the user before they can access the system
4. Role determines which panel (admin/member) the user can access

## 📊 Data Models

### Users Collection
```typescript
{
  uid: string;
  email: string;
  name: string;
  role: 'member' | 'admin' | 'coach';
  approved: boolean;
  createdAt: Date;
}
```

### Members Collection
```typescript
{
  uid: string;
  name: string;
  email: string;
  phone?: string;
  emergencyContact?: {...};
  certifications: [...];
  medicalCertificate: {
    expiryDate: Date;
    status: 'valid' | 'expiring_soon' | 'expired';
  };
  personalBests: {
    STA?: number;
    DYN?: number;
    DNF?: number;
    CWT?: number;
  };
  membershipStatus: 'active' | 'pending' | 'expired';
  membershipExpiry?: Date;
}
```

### Sessions Collection
```typescript
{
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  type: 'pool' | 'open_water' | 'theory' | 'competition';
  capacity: number;
  currentAttendance: number;
  description?: string;
}
```

### Invoices Collection
```typescript
{
  id: string;
  memberId: string;
  amount: number;
  status: 'pending' | 'transfer_initiated' | 'paid' | 'overdue';
  uniquePaymentReference: string;
  dueDate: Date;
}
```

## 💳 Payment Flow

The app uses **Manual Bank Transfer Verification**:

1. Admin creates an invoice for a member
2. Member sees the invoice with payment instructions (IBAN, reference)
3. Member completes the bank transfer externally
4. Member clicks "I've Completed the Transfer" to update status to `transfer_initiated`
5. Admin verifies the payment in their bank account
6. Admin clicks "Confirm Payment" to mark as paid and activate membership

## 🎨 Customizing the Theme

To match your brand colors, edit `src/theme/theme.ts`:

```typescript
palette: {
  primary: {
    main: '#0A4D68', // Your primary color
  },
  secondary: {
    main: '#00A9A5', // Your secondary color
  },
}
```

## 📝 Common Tasks

### Adding a New Member (Admin)
1. Navigate to Admin Panel → Members
2. Click "Add Member"
3. Fill in member details including medical certificate expiry
4. Save

### Creating a Training Session (Admin)
1. Navigate to Admin Panel → Sessions
2. Click "Create Session"
3. Fill in date, time, location, type, and capacity
4. Save

### Booking a Session (Member)
1. Navigate to Member Panel → Book Sessions
2. View the weekly schedule
3. Click "Book Now" on desired session
4. Booking confirmed!

### Processing a Payment (Admin)
1. Navigate to Admin Panel → Payments
2. View invoices with status "Transfer Initiated"
3. Verify the payment reference in your bank account
4. Click "Confirm Payment" to activate the member

## 🐛 Troubleshooting

### Build Errors
- Ensure all dependencies are installed: `npm install`
- Clear cache: `npm cache clean --force`
- Delete `node_modules` and reinstall

### Firebase Connection Issues
- Verify `.env` file has correct Firebase credentials
- Check Firebase project is active
- Ensure Firestore and Authentication are enabled

### Deployment Issues
- Check `package.json` homepage URL is correct
- Ensure you have write access to the repository
- Verify gh-pages branch exists after first deploy

## 📄 License

This project is private and proprietary to BlueMind Freediving.

## 🤝 Support

For questions or issues, contact the development team.

---

**Built with ❤️ for BlueMind Freediving** 🌊
