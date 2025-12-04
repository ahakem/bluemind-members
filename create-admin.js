/**
 * One-time script to create an admin user
 * 
 * Usage:
 * 1. Make sure you have Firebase Admin SDK: npm install firebase-admin
 * 2. Download your service account key from Firebase Console:
 *    Project Settings > Service Accounts > Generate new private key
 * 3. Save it as 'serviceAccountKey.json' in the project root
 * 4. Run: node create-admin.js
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdminUser() {
  try {
    console.log('\n🔧 BlueMind Admin User Creator\n');
    
    const email = await question('Enter admin email: ');
    const password = await question('Enter admin password (min 6 characters): ');
    const name = await question('Enter admin name: ');
    
    // Create authentication user
    console.log('\n📝 Creating authentication user...');
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: name
    });
    
    console.log(`✅ Auth user created with UID: ${userRecord.uid}`);
    
    // Create user document in Firestore
    console.log('📝 Creating user document...');
    await db.collection('users').doc(userRecord.uid).set({
      email: email,
      name: name,
      role: 'admin',
      approved: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ User document created');
    
    // Create member document
    console.log('📝 Creating member document...');
    await db.collection('members').doc(userRecord.uid).set({
      uid: userRecord.uid,
      name: name,
      email: email,
      phone: '',
      dateOfBirth: null,
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      },
      certifications: [],
      membershipStatus: 'active',
      membershipStartDate: admin.firestore.FieldValue.serverTimestamp(),
      membershipEndDate: null,
      medicalCertificate: {
        hasValidCertificate: false,
        expiryDate: null
      },
      personalBests: {
        staticApnea: null,
        dynamicApnea: null,
        freeImmersion: null,
        constantWeight: null
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Member document created');
    console.log('\n🎉 Admin user created successfully!');
    console.log(`\nYou can now login with:`);
    console.log(`Email: ${email}`);
    console.log(`Password: [the password you entered]\n`);
    
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
    if (error.code === 'auth/email-already-exists') {
      console.log('\n💡 This email is already registered. You can:');
      console.log('   1. Use a different email');
      console.log('   2. Manually promote the existing user in Firestore Console');
    }
  } finally {
    rl.close();
    process.exit();
  }
}

createAdminUser();
