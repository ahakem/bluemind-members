/**
 * Input validation and sanitization utilities
 * Note: Firebase Firestore is NoSQL and doesn't use SQL queries,
 * so SQL injection is not possible. However, we sanitize inputs for:
 * - XSS prevention
 * - Data integrity
 * - Malicious content prevention
 */

// Sanitize string input - removes HTML tags and trims whitespace
export const sanitizeString = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, ''); // Remove remaining angle brackets
};

// Sanitize for display (escape HTML entities)
export const escapeHtml = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return input.replace(/[&<>"']/g, (char) => map[char]);
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (international format)
export const isValidPhone = (phone: string): boolean => {
  // Allows: +31612345678, 0612345678, 06-12345678, +31 6 12345678
  const phoneRegex = /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Sanitize phone number - keep only digits and +
export const sanitizePhone = (phone: string): string => {
  if (!phone || typeof phone !== 'string') return '';
  return phone.replace(/[^\d+\-\s]/g, '').trim();
};

// Validate name (no special characters except spaces, hyphens, apostrophes)
export const isValidName = (name: string): boolean => {
  const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;
  return nameRegex.test(name) && name.length >= 2 && name.length <= 100;
};

// Sanitize name
export const sanitizeName = (name: string): string => {
  if (!name || typeof name !== 'string') return '';
  return name
    .trim()
    .replace(/[^a-zA-ZÀ-ÿ\s\-']/g, '')
    .substring(0, 100);
};

// Validate postal code (Dutch format or general)
export const isValidPostalCode = (postalCode: string, country?: string): boolean => {
  if (country === 'Netherlands' || country === 'NL') {
    // Dutch format: 1234AB or 1234 AB (4 digits + 2 letters)
    const cleaned = postalCode.replace(/\s/g, '').toUpperCase();
    return /^[1-9][0-9]{3}[A-Z]{2}$/.test(cleaned);
  }
  // General: allow alphanumeric with spaces/hyphens
  return /^[A-Za-z0-9\s\-]{3,10}$/.test(postalCode);
};

// Format Dutch postal code (1234AB -> 1234 AB)
export const formatDutchPostalCode = (postalCode: string): string => {
  const cleaned = postalCode.replace(/\s/g, '').toUpperCase();
  if (/^[1-9][0-9]{3}[A-Z]{2}$/.test(cleaned)) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
  }
  return postalCode;
};

// Sanitize postal code
export const sanitizePostalCode = (postalCode: string, country?: string): string => {
  if (!postalCode || typeof postalCode !== 'string') return '';
  const cleaned = postalCode.trim().toUpperCase();
  if (country === 'Netherlands' || country === 'NL') {
    return formatDutchPostalCode(cleaned);
  }
  return cleaned;
};

// Validate IBAN
export const isValidIBAN = (iban: string): boolean => {
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();
  // Basic IBAN format check (starts with 2 letters, then 2 digits, then up to 30 alphanumeric)
  return /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/.test(cleanIban);
};

// Validate URL
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Check for potentially malicious patterns
export const hasMaliciousPatterns = (input: string): boolean => {
  const maliciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
    /javascript:/gi, // JavaScript protocol
    /on\w+\s*=/gi, // Event handlers (onclick, onerror, etc.)
    /data:/gi, // Data URLs
    /vbscript:/gi, // VBScript protocol
  ];
  
  return maliciousPatterns.some(pattern => pattern.test(input));
};

// Comprehensive input sanitization
export const sanitizeInput = (input: string, options?: {
  maxLength?: number;
  allowHtml?: boolean;
  type?: 'name' | 'email' | 'phone' | 'text' | 'url';
}): string => {
  if (!input || typeof input !== 'string') return '';
  
  let sanitized = input.trim();
  
  // Check for malicious patterns
  if (hasMaliciousPatterns(sanitized)) {
    console.warn('Potentially malicious input detected');
    sanitized = sanitized
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }
  
  // Remove HTML if not allowed
  if (!options?.allowHtml) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }
  
  // Type-specific sanitization
  switch (options?.type) {
    case 'name':
      sanitized = sanitizeName(sanitized);
      break;
    case 'phone':
      sanitized = sanitizePhone(sanitized);
      break;
    case 'email':
      sanitized = sanitized.toLowerCase();
      break;
  }
  
  // Apply max length
  if (options?.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }
  
  return sanitized;
};

// Validate object fields (for form data)
export const validateFormData = (data: Record<string, any>, rules: Record<string, {
  required?: boolean;
  type?: 'string' | 'number' | 'email' | 'phone' | 'name' | 'url';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}>): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      errors[field] = `${field} is required`;
      continue;
    }
    
    if (!value) continue;
    
    if (rule.type === 'email' && !isValidEmail(value)) {
      errors[field] = 'Invalid email format';
    }
    
    if (rule.type === 'phone' && !isValidPhone(value)) {
      errors[field] = 'Invalid phone number';
    }
    
    if (rule.type === 'name' && !isValidName(value)) {
      errors[field] = 'Invalid name format';
    }
    
    if (rule.type === 'url' && !isValidUrl(value)) {
      errors[field] = 'Invalid URL format';
    }
    
    if (rule.minLength && value.length < rule.minLength) {
      errors[field] = `Minimum ${rule.minLength} characters required`;
    }
    
    if (rule.maxLength && value.length > rule.maxLength) {
      errors[field] = `Maximum ${rule.maxLength} characters allowed`;
    }
    
    if (rule.pattern && !rule.pattern.test(value)) {
      errors[field] = `Invalid format`;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
