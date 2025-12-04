// Utility functions for the BlueMind Freediving app

/**
 * Generate a unique payment reference for invoices
 * Format: BM-YYYY-XXX-RANDOM
 */
export const generatePaymentReference = (): string => {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const sequence = Math.floor(Math.random() * 999) + 1;
  return `BM-${year}-${sequence.toString().padStart(3, '0')}-${random}`;
};

/**
 * Calculate medical certificate status based on expiry date
 */
export const calculateMedicalStatus = (
  expiryDate: Date
): 'valid' | 'expiring_soon' | 'expired' => {
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  if (expiryDate < now) return 'expired';
  if (expiryDate < thirtyDaysFromNow) return 'expiring_soon';
  return 'valid';
};

/**
 * Format time in seconds to MM:SS format
 */
export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Check if a session is in the past
 */
export const isSessionPast = (sessionDate: Date): boolean => {
  return sessionDate < new Date();
};

/**
 * Check if a session is full
 */
export const isSessionFull = (currentAttendance: number, capacity: number): boolean => {
  return currentAttendance >= capacity;
};

/**
 * Calculate days until a date
 */
export const daysUntil = (date: Date): number => {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number, currency: string = 'EUR'): string => {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};
