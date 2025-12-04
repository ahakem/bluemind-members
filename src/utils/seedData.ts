/**
 * Sample data seeding script for development/testing
 * 
 * IMPORTANT: This is for development only. Do NOT use in production!
 * 
 * To use this script:
 * 1. Update the Firebase config in src/config/firebase.ts
 * 2. Create a temporary page that imports and calls these functions
 * 3. Run the functions once to populate Firestore
 * 4. Remove the temporary page
 */

import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { generatePaymentReference } from '../utils/helpers';

/**
 * Seed sample members
 */
export const seedMembers = async () => {
  const members = [
    {
      uid: 'sample-member-1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+31612345678',
      emergencyContact: {
        name: 'Jane Doe',
        phone: '+31687654321',
        relationship: 'Spouse',
      },
      certifications: [
        {
          organization: 'AIDA',
          level: 'AIDA 3',
          date: new Date('2023-06-15'),
        },
      ],
      medicalCertificate: {
        expiryDate: Timestamp.fromDate(new Date('2025-12-31')),
        status: 'valid',
      },
      personalBests: {
        STA: 240, // 4:00
        DYN: 75,
        DNF: 50,
      },
      membershipStatus: 'active',
      membershipExpiry: Timestamp.fromDate(new Date('2025-12-31')),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      uid: 'sample-member-2',
      name: 'Sarah Smith',
      email: 'sarah@example.com',
      phone: '+31623456789',
      emergencyContact: {
        name: 'Mike Smith',
        phone: '+31698765432',
        relationship: 'Sibling',
      },
      certifications: [
        {
          organization: 'SSI',
          level: 'Level 2',
          date: new Date('2024-03-20'),
        },
      ],
      medicalCertificate: {
        expiryDate: Timestamp.fromDate(new Date('2025-06-30')),
        status: 'valid',
      },
      personalBests: {
        STA: 180, // 3:00
        DYN: 60,
      },
      membershipStatus: 'active',
      membershipExpiry: Timestamp.fromDate(new Date('2025-06-30')),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
  ];

  try {
    for (const member of members) {
      await addDoc(collection(db, 'members'), member);
    }
    console.log('Members seeded successfully!');
  } catch (error) {
    console.error('Error seeding members:', error);
  }
};

/**
 * Seed sample sessions
 */
export const seedSessions = async () => {
  const today = new Date();
  const sessions = [
    {
      date: Timestamp.fromDate(new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)), // 2 days from now
      startTime: '19:00',
      endTime: '21:00',
      location: 'Sloterparkbad, Amsterdam',
      type: 'pool',
      capacity: 12,
      currentAttendance: 5,
      description: 'Pool training - Static and Dynamic practice',
      createdBy: 'admin-uid',
      createdAt: Timestamp.now(),
    },
    {
      date: Timestamp.fromDate(new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)), // 5 days from now
      startTime: '10:00',
      endTime: '14:00',
      location: 'Vinkeveen Lake',
      type: 'open_water',
      capacity: 8,
      currentAttendance: 3,
      description: 'Open water depth training',
      createdBy: 'admin-uid',
      createdAt: Timestamp.now(),
    },
    {
      date: Timestamp.fromDate(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)), // 7 days from now
      startTime: '20:00',
      endTime: '21:30',
      location: 'Online (Zoom)',
      type: 'theory',
      capacity: 20,
      currentAttendance: 8,
      description: 'Physiology and safety lecture',
      createdBy: 'admin-uid',
      createdAt: Timestamp.now(),
    },
  ];

  try {
    for (const session of sessions) {
      await addDoc(collection(db, 'sessions'), session);
    }
    console.log('Sessions seeded successfully!');
  } catch (error) {
    console.error('Error seeding sessions:', error);
  }
};

/**
 * Seed sample invoices
 */
export const seedInvoices = async () => {
  const invoices = [
    {
      memberId: 'sample-member-1',
      memberName: 'John Doe',
      memberEmail: 'john@example.com',
      amount: 250,
      currency: 'EUR',
      status: 'paid',
      uniquePaymentReference: generatePaymentReference(),
      description: 'Annual Membership 2024',
      dueDate: Timestamp.fromDate(new Date('2024-01-31')),
      createdAt: Timestamp.fromDate(new Date('2024-01-01')),
      updatedAt: Timestamp.now(),
      paidAt: Timestamp.fromDate(new Date('2024-01-15')),
    },
    {
      memberId: 'sample-member-2',
      memberName: 'Sarah Smith',
      memberEmail: 'sarah@example.com',
      amount: 250,
      currency: 'EUR',
      status: 'transfer_initiated',
      uniquePaymentReference: generatePaymentReference(),
      description: 'Annual Membership 2025',
      dueDate: Timestamp.fromDate(new Date('2025-01-31')),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      transferInitiatedAt: Timestamp.now(),
    },
  ];

  try {
    for (const invoice of invoices) {
      await addDoc(collection(db, 'invoices'), invoice);
    }
    console.log('Invoices seeded successfully!');
  } catch (error) {
    console.error('Error seeding invoices:', error);
  }
};

/**
 * Seed all sample data
 */
export const seedAllData = async () => {
  console.log('Starting data seeding...');
  await seedMembers();
  await seedSessions();
  await seedInvoices();
  console.log('All data seeded successfully!');
};
