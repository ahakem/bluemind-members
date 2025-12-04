// TypeScript interfaces for Firestore data models

export type UserRole = 'member' | 'board' | 'admin' | 'coach' | 'super-admin';

export interface User {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  approved: boolean;
}

// Pool Location
export interface PoolLocation {
  id: string;
  name: string;
  address: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Bank Details for payments
export interface BankDetails {
  id: string;
  accountHolder: string;
  iban: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Member {
  uid: string;
  name: string;
  nickname?: string; // Optional nickname
  email: string;
  dateOfBirth?: Date;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  phone?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  // Insurance & Health
  hasInsurance: boolean;
  insuranceProofProvided?: boolean;
  // Photography consent
  photographyConsent: boolean;
  // Emergency Responder
  isEmergencyResponder: boolean;
  emergencyResponderProof?: string; // base64 or URL if needed
  // Freediving certifications
  certifications: {
    organization: string;
    level: string;
    date: Date;
    proofDocument?: string; // base64 or URL
  }[];
  medicalCertificate: {
    expiryDate: Date;
    status: 'valid' | 'expiring_soon' | 'expired';
  };
  personalBests: {
    STA?: string; // Static Apnea in mm:ss format
    DYN?: number; // Dynamic Apnea with fins in meters
    DYNBIFI?: number; // Dynamic Apnea bifins in meters
    DNF?: number; // Dynamic No Fins in meters
    CWT?: number; // Constant Weight in meters
    CWTB?: number; // Constant Weight Bifins in meters
    CNF?: number; // Constant No Fins in meters
  };
  membershipStatus: 'active' | 'pending' | 'expired';
  membershipExpiry?: Date;
  membershipNumber?: string; // Assigned by admin
  // Legal agreements & signature
  agreedToTerms: boolean;
  agreedToLiabilityWaiver: boolean;
  agreedToHouseRules: boolean;
  agreedToPrivacyPolicy: boolean;
  signature: string; // base64 encoded signature image
  parentSignature?: string; // For minors
  registrationDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  locationId: string; // Reference to PoolLocation
  locationName: string; // Denormalized for display
  type: 'pool' | 'open_water' | 'theory' | 'competition';
  capacity: number;
  currentAttendance: number;
  description?: string;
  coach?: string;
  // Pricing
  priceBoard: number; // Price for board members
  priceMember: number; // Price for regular members
  // Repeat settings
  repeatWeekly: boolean;
  repeatEndDate?: Date; // When to stop repeating
  parentSessionId?: string; // Reference to parent session if created from repeat
  // Management
  createdBy: string;
  createdAt: Date;
}

export interface Attendance {
  id: string;
  sessionId: string;
  memberId: string;
  memberName: string;
  status: 'confirmed' | 'attended' | 'cancelled' | 'no_show';
  rsvpAt: Date;
  updatedAt: Date;
}

export type InvoiceStatus = 'pending' | 'transfer_initiated' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  amount: number;
  currency: 'EUR';
  status: InvoiceStatus;
  uniquePaymentReference: string; // e.g., "BM-2024-001-ABC123"
  description: string;
  sessionId?: string; // Reference to session if created from subscription
  sessionDate?: Date;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  transferInitiatedAt?: Date;
  confirmedBy?: string; // Admin who confirmed the payment
  confirmedAt?: Date;
}

export interface PaymentInfo {
  iban: string;
  bankName: string;
  accountHolder: string;
}

// Content Management System
export interface ContentPage {
  id: string; // 'house-rules', 'liability-waiver', 'privacy-policy'
  title: string;
  content: string; // HTML content from rich text editor
  lastUpdatedBy: string; // User ID
  lastUpdatedAt: Date;
  createdAt: Date;
}
