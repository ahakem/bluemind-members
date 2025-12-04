import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Grid,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
  FormLabel,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import SignaturePad from '../components/SignaturePad';
import PasswordStrength from '../components/PasswordStrength';
import PageLayout from '../components/PageLayout';
import { doc, setDoc, Timestamp, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

const steps = [
  { label: 'Account & Personal Info', short: 'Account' },
  { label: 'Emergency Contact & Insurance', short: 'Emergency' },
  { label: 'Certifications & Experience', short: 'Certs' },
  { label: 'Agreements & Signature', short: 'Sign' },
];

// Password validation helper
const validatePassword = (password: string): { isValid: boolean; message: string } => {
  if (!password) return { isValid: false, message: 'Password is required' };
  if (password.length < 8) return { isValid: false, message: 'Password must be at least 8 characters' };
  
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  // Require at least 3 of the 4 criteria for a good password
  const criteriaMet = [hasUppercase, hasLowercase, hasNumber].filter(Boolean).length;
  
  if (criteriaMet < 2) {
    return { isValid: false, message: 'Password must include uppercase, lowercase, and numbers' };
  }
  
  return { isValid: true, message: '' };
};

const RegistrationForm: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();
  
  // Track which documents have been opened
  const [documentsOpened, setDocumentsOpened] = useState({
    houseRules: false,
    liabilityWaiver: false,
    privacyPolicy: false,
  });

  // Field-level errors for inline validation
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Step 1: Account & Personal Info
  const [formData, setFormData] = useState({
    // Account
    email: '',
    password: '',
    confirmPassword: '',
    // Personal
    name: '',
    nickname: '',
    dateOfBirth: '',
    street: '',
    city: '',
    postalCode: '',
    country: 'Netherlands',
    phone: '',
    // Emergency Contact
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelationship: '',
    // Insurance
    hasInsurance: 'yes',
    // Photography
    photographyConsent: 'yes',
    // Emergency Responder
    isEmergencyResponder: 'no',
    // Certifications
    certOrganization: '',
    certLevel: '',
    certDate: '',
    // Agreements
    agreedToTerms: false,
    agreedToLiabilityWaiver: false,
    agreedToHouseRules: false,
    agreedToPrivacyPolicy: false,
    // Signature
    signature: '',
    parentSignature: '',
  });

  const isMinor = () => {
    if (!formData.dateOfBirth) return false;
    const birthDate = new Date(formData.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age < 18;
  };

  const handleNext = () => {
    // Validation for each step with field-level errors
    const errors: Record<string, string> = {};
    
    if (activeStep === 0) {
      if (!formData.email) errors.email = 'Email is required';
      else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) errors.email = 'Please enter a valid email address';
      }
      
      // Enhanced password validation
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.message;
      }
      
      if (!formData.confirmPassword) errors.confirmPassword = 'Please confirm your password';
      else if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
      if (!formData.name) errors.name = 'Full name is required';
      if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
      if (!formData.phone) errors.phone = 'Phone number is required';
      if (!formData.street) errors.street = 'Street address is required';
      if (!formData.city) errors.city = 'City is required';
      if (!formData.postalCode) errors.postalCode = 'Postal code is required';
      
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setError('Please fix the errors below');
        return;
      }
    }

    if (activeStep === 1) {
      if (!formData.emergencyName) errors.emergencyName = 'Emergency contact name is required';
      if (!formData.emergencyPhone) errors.emergencyPhone = 'Emergency contact phone is required';
      if (!formData.emergencyRelationship) errors.emergencyRelationship = 'Relationship is required';
      if (formData.hasInsurance === 'no') {
        errors.hasInsurance = 'Valid health insurance in the Netherlands is required to join';
      }
      
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setError('Please fix the errors below');
        return;
      }
    }

    if (activeStep === 2) {
      if (!formData.certOrganization) errors.certOrganization = 'Organization is required';
      if (!formData.certLevel) errors.certLevel = 'Certification level is required';
      if (!formData.certDate) errors.certDate = 'Certification date is required';
      
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setError('Please fix the errors below');
        return;
      }
    }

    if (activeStep === 3) {
      if (!formData.agreedToHouseRules) errors.agreedToHouseRules = 'You must agree to the House Rules';
      if (!formData.agreedToLiabilityWaiver) errors.agreedToLiabilityWaiver = 'You must agree to the Liability Waiver';
      if (!formData.agreedToPrivacyPolicy) errors.agreedToPrivacyPolicy = 'You must agree to the Privacy Policy';
      if (!formData.agreedToTerms) errors.agreedToTerms = 'You must confirm the above declaration';
      if (!formData.signature) errors.signature = 'Your signature is required';
      if (isMinor() && !formData.parentSignature) errors.parentSignature = 'Parent/Guardian signature is required for members under 18';
      
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setError('Please fix the errors below');
        return;
      }
    }

    setFieldErrors({});
    setError('');
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleStepClick = (step: number) => {
    // Allow clicking on completed steps to go back
    if (step < activeStep) {
      setActiveStep(step);
      setError('');
    }
  };

  const handleSubmit = async () => {
    // Validate Step 3 before submitting
    if (!formData.agreedToTerms || !formData.agreedToLiabilityWaiver || 
        !formData.agreedToHouseRules || !formData.agreedToPrivacyPolicy) {
      setError('You must agree to all terms and conditions before submitting');
      return;
    }
    if (!formData.signature) {
      setError('Please provide your signature before submitting');
      return;
    }
    if (isMinor() && !formData.parentSignature) {
      setError('Parent/Guardian signature is required for members under 18');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let userId: string;
      let isNewUser = true;
      
      try {
        // Try to create Firebase Auth account
        const userCredential = await signUp(formData.email, formData.password, formData.name);
        userId = userCredential.user.uid;
      } catch (authError: any) {
        // If account already exists, try to sign in and complete registration
        if (authError.code === 'auth/email-already-in-use') {
          try {
            await signIn(formData.email, formData.password);
            const currentUser = auth.currentUser;
            if (!currentUser) {
              throw new Error('Please login with your existing account credentials.');
            }
            userId = currentUser.uid;
            isNewUser = false;
            
            // Check if member data already exists
            const memberDoc = await getDoc(doc(db, 'members', userId));
            if (memberDoc.exists()) {
              setError('Your registration is already complete. Please login instead.');
              setLoading(false);
              return;
            }
            
            console.log('Completing registration for existing user:', userId);
          } catch (signInError: any) {
            throw new Error('This email is already registered but the password is incorrect. Please use the correct password or contact support.');
          }
        } else {
          throw authError;
        }
      }
      
      // Create comprehensive member document
      const memberData = {
        uid: userId!,
        name: formData.name,
        nickname: formData.nickname || null,
        email: formData.email,
        dateOfBirth: Timestamp.fromDate(new Date(formData.dateOfBirth)),
        address: {
          street: formData.street,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
        },
        phone: formData.phone,
        emergencyContact: {
          name: formData.emergencyName,
          phone: formData.emergencyPhone,
          relationship: formData.emergencyRelationship,
        },
        hasInsurance: formData.hasInsurance === 'yes',
        insuranceProofProvided: false,
        photographyConsent: formData.photographyConsent === 'yes',
        isEmergencyResponder: formData.isEmergencyResponder === 'yes',
        certifications: [{
          organization: formData.certOrganization,
          level: formData.certLevel,
          date: Timestamp.fromDate(new Date(formData.certDate)),
        }],
        medicalCertificate: {
          expiryDate: null,
          status: 'expired',
        },
        personalBests: {
          STA: null,
          DYN: null,
          DYNBIFI: null,
          DNF: null,
          CWT: null,
          CWTB: null,
          CNF: null,
        },
        membershipStatus: 'pending',
        membershipExpiry: null,
        agreedToTerms: true,
        agreedToLiabilityWaiver: true,
        agreedToHouseRules: true,
        agreedToPrivacyPolicy: true,
        signature: formData.signature,
        parentSignature: formData.parentSignature || null,
        registrationDate: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(doc(db, 'members', userId!), memberData);

      // Navigate to pending approval
      navigate('/pending-approval');
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Handle specific error cases
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please use a different email or login if you already have an account.');
        setActiveStep(0); // Go back to first step to change email
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address. Please check your email and try again.');
        setActiveStep(0);
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
        setActiveStep(0);
      } else {
        setError(err.message || 'Failed to complete registration. Please try again.');
      }
      
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                }}
                required
                error={!!fieldErrors.email}
                helperText={fieldErrors.email}
                autoComplete="email"
                inputProps={{ inputMode: 'email' }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                }}
                required
                error={!!fieldErrors.password}
                helperText={fieldErrors.password}
                autoComplete="new-password"
              />
              <PasswordStrength password={formData.password} />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value });
                  if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: '' });
                }}
                required
                error={!!fieldErrors.confirmPassword}
                helperText={fieldErrors.confirmPassword || (formData.confirmPassword && formData.password === formData.confirmPassword ? '✓ Passwords match' : '')}
                autoComplete="new-password"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' });
                }}
                required
                error={!!fieldErrors.name}
                helperText={fieldErrors.name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nickname (Optional)"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                helperText="How you'd like to be called"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => {
                  setFormData({ ...formData, dateOfBirth: e.target.value });
                  if (fieldErrors.dateOfBirth) setFieldErrors({ ...fieldErrors, dateOfBirth: '' });
                }}
                InputLabelProps={{ shrink: true }}
                required
                error={!!fieldErrors.dateOfBirth}
                helperText={fieldErrors.dateOfBirth}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: '' });
                }}
                required
                error={!!fieldErrors.phone}
                helperText={fieldErrors.phone}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                value={formData.street}
                onChange={(e) => {
                  setFormData({ ...formData, street: e.target.value });
                  if (fieldErrors.street) setFieldErrors({ ...fieldErrors, street: '' });
                }}
                required
                error={!!fieldErrors.street}
                helperText={fieldErrors.street}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={(e) => {
                  setFormData({ ...formData, city: e.target.value });
                  if (fieldErrors.city) setFieldErrors({ ...fieldErrors, city: '' });
                }}
                required
                error={!!fieldErrors.city}
                helperText={fieldErrors.city}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Postal Code"
                value={formData.postalCode}
                onChange={(e) => {
                  setFormData({ ...formData, postalCode: e.target.value });
                  if (fieldErrors.postalCode) setFieldErrors({ ...fieldErrors, postalCode: '' });
                }}
                required
                error={!!fieldErrors.postalCode}
                helperText={fieldErrors.postalCode}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Emergency Contact Information
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Emergency Contact Full Name"
                value={formData.emergencyName}
                onChange={(e) => {
                  setFormData({ ...formData, emergencyName: e.target.value });
                  if (fieldErrors.emergencyName) setFieldErrors({ ...fieldErrors, emergencyName: '' });
                }}
                required
                error={!!fieldErrors.emergencyName}
                helperText={fieldErrors.emergencyName}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Relationship"
                value={formData.emergencyRelationship}
                onChange={(e) => {
                  setFormData({ ...formData, emergencyRelationship: e.target.value });
                  if (fieldErrors.emergencyRelationship) setFieldErrors({ ...fieldErrors, emergencyRelationship: '' });
                }}
                required
                error={!!fieldErrors.emergencyRelationship}
                helperText={fieldErrors.emergencyRelationship}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Emergency Contact Phone"
                value={formData.emergencyPhone}
                onChange={(e) => {
                  setFormData({ ...formData, emergencyPhone: e.target.value });
                  if (fieldErrors.emergencyPhone) setFieldErrors({ ...fieldErrors, emergencyPhone: '' });
                }}
                required
                error={!!fieldErrors.emergencyPhone}
                helperText={fieldErrors.emergencyPhone}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Insurance
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                As a condition of membership, you are required to maintain standard health
                insurance valid in the Netherlands.
              </Alert>
            </Grid>
            <Grid item xs={12}>
              <FormControl error={!!fieldErrors.hasInsurance}>
                <FormLabel>Do you have health insurance valid in the Netherlands?</FormLabel>
                <RadioGroup
                  value={formData.hasInsurance}
                  onChange={(e) => {
                    setFormData({ ...formData, hasInsurance: e.target.value });
                    if (fieldErrors.hasInsurance) setFieldErrors({ ...fieldErrors, hasInsurance: '' });
                  }}
                >
                  <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                  <FormControlLabel value="no" control={<Radio />} label="No" />
                </RadioGroup>
                {fieldErrors.hasInsurance && (
                  <Typography variant="caption" color="error">{fieldErrors.hasInsurance}</Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Photography and Media Release
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControl>
                <FormLabel>
                  Do you consent to the use of photos/videos for promotional purposes?
                </FormLabel>
                <RadioGroup
                  value={formData.photographyConsent}
                  onChange={(e) => setFormData({ ...formData, photographyConsent: e.target.value })}
                >
                  <FormControlLabel value="yes" control={<Radio />} label="Yes, I consent" />
                  <FormControlLabel value="no" control={<Radio />} label="No, I do not consent" />
                </RadioGroup>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Emergency Responder Certification
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControl>
                <FormLabel>
                  Are you a certified emergency responder (CPR / First Aid / AED)?
                </FormLabel>
                <RadioGroup
                  value={formData.isEmergencyResponder}
                  onChange={(e) => setFormData({ ...formData, isEmergencyResponder: e.target.value })}
                >
                  <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                  <FormControlLabel value="no" control={<Radio />} label="No" />
                </RadioGroup>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Freediving Certification
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Please provide your highest freediving certification (AIDA 2, SSI 1, or equivalent)
              </Alert>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Organization"
                placeholder="e.g., AIDA, SSI, PADI"
                value={formData.certOrganization}
                onChange={(e) => {
                  setFormData({ ...formData, certOrganization: e.target.value });
                  if (fieldErrors.certOrganization) setFieldErrors({ ...fieldErrors, certOrganization: '' });
                }}
                required
                error={!!fieldErrors.certOrganization}
                helperText={fieldErrors.certOrganization}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Level"
                placeholder="e.g., AIDA 2, SSI Level 1"
                value={formData.certLevel}
                onChange={(e) => {
                  setFormData({ ...formData, certLevel: e.target.value });
                  if (fieldErrors.certLevel) setFieldErrors({ ...fieldErrors, certLevel: '' });
                }}
                required
                error={!!fieldErrors.certLevel}
                helperText={fieldErrors.certLevel}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Certification Date"
                type="date"
                value={formData.certDate}
                onChange={(e) => {
                  setFormData({ ...formData, certDate: e.target.value });
                  if (fieldErrors.certDate) setFieldErrors({ ...fieldErrors, certDate: '' });
                }}
                InputLabelProps={{ shrink: true }}
                required
                error={!!fieldErrors.certDate}
                helperText={fieldErrors.certDate}
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Acknowledgment and Agreement
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Please read the following documents carefully before agreeing:
              </Typography>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <strong>All agreements are required</strong> - You must read and agree to all documents before you can complete registration.
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ border: fieldErrors.agreedToHouseRules ? '1px solid #d32f2f' : 'none', borderRadius: 1, p: fieldErrors.agreedToHouseRules ? 1 : 0 }}>
                <FormControlLabel
                  required
                  control={
                    <Checkbox
                      checked={formData.agreedToHouseRules}
                      onChange={(e) => {
                        if (!documentsOpened.houseRules) {
                          setFieldErrors({ ...fieldErrors, agreedToHouseRules: 'Please open and read the document first' });
                          return;
                        }
                        setFormData({ ...formData, agreedToHouseRules: e.target.checked });
                        if (fieldErrors.agreedToHouseRules) setFieldErrors({ ...fieldErrors, agreedToHouseRules: '' });
                      }}
                      required
                    />
                  }
                  label={
                    <span>
                      I have read, understood, and agree to comply with the{' '}
                      <a 
                        href="#/documents/house-rules" 
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#0A4D68', fontWeight: 'bold' }}
                        onClick={() => setDocumentsOpened({ ...documentsOpened, houseRules: true })}
                      >
                        BMF House Rules
                      </a>
                      , including the Safety Protocols and Membership Terms. <span style={{ color: 'red' }}>*</span>
                    </span>
                  }
                />
                {fieldErrors.agreedToHouseRules && (
                  <Typography variant="caption" color="error" sx={{ ml: 4, display: 'block' }}>{fieldErrors.agreedToHouseRules}</Typography>
                )}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ border: fieldErrors.agreedToLiabilityWaiver ? '1px solid #d32f2f' : 'none', borderRadius: 1, p: fieldErrors.agreedToLiabilityWaiver ? 1 : 0 }}>
                <FormControlLabel
                  required
                  control={
                    <Checkbox
                      checked={formData.agreedToLiabilityWaiver}
                      onChange={(e) => {
                        if (!documentsOpened.liabilityWaiver) {
                          setFieldErrors({ ...fieldErrors, agreedToLiabilityWaiver: 'Please open and read the document first' });
                          return;
                        }
                        setFormData({ ...formData, agreedToLiabilityWaiver: e.target.checked });
                        if (fieldErrors.agreedToLiabilityWaiver) setFieldErrors({ ...fieldErrors, agreedToLiabilityWaiver: '' });
                      }}
                      required
                    />
                  }
                  label={
                    <span>
                      I have read and agree to the{' '}
                      <a 
                        href="#/documents/liability-waiver" 
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#0A4D68', fontWeight: 'bold' }}
                        onClick={() => setDocumentsOpened({ ...documentsOpened, liabilityWaiver: true })}
                      >
                        Liability Waiver & Release Form
                      </a>
                      . <span style={{ color: 'red' }}>*</span>
                    </span>
                  }
                />
                {fieldErrors.agreedToLiabilityWaiver && (
                  <Typography variant="caption" color="error" sx={{ ml: 4, display: 'block' }}>{fieldErrors.agreedToLiabilityWaiver}</Typography>
                )}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ border: fieldErrors.agreedToPrivacyPolicy ? '1px solid #d32f2f' : 'none', borderRadius: 1, p: fieldErrors.agreedToPrivacyPolicy ? 1 : 0 }}>
                <FormControlLabel
                  required
                  control={
                    <Checkbox
                      checked={formData.agreedToPrivacyPolicy}
                      onChange={(e) => {
                        if (!documentsOpened.privacyPolicy) {
                          setFieldErrors({ ...fieldErrors, agreedToPrivacyPolicy: 'Please open and read the document first' });
                          return;
                        }
                        setFormData({ ...formData, agreedToPrivacyPolicy: e.target.checked });
                        if (fieldErrors.agreedToPrivacyPolicy) setFieldErrors({ ...fieldErrors, agreedToPrivacyPolicy: '' });
                      }}
                      required
                    />
                  }
                  label={
                    <span>
                      I have read and agree to the{' '}
                      <a 
                        href="#/documents/privacy-policy" 
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#0A4D68', fontWeight: 'bold' }}
                        onClick={() => setDocumentsOpened({ ...documentsOpened, privacyPolicy: true })}
                      >
                        Privacy Policy
                      </a>
                    . <span style={{ color: 'red' }}>*</span>
                  </span>
                }
              />
              {fieldErrors.agreedToPrivacyPolicy && (
                <Typography variant="caption" color="error" sx={{ ml: 4, display: 'block' }}>{fieldErrors.agreedToPrivacyPolicy}</Typography>
              )}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ border: fieldErrors.agreedToTerms ? '1px solid #d32f2f' : 'none', borderRadius: 1, p: fieldErrors.agreedToTerms ? 1 : 0 }}>
                <FormControlLabel
                  required
                  control={
                    <Checkbox
                      checked={formData.agreedToTerms}
                      onChange={(e) => {
                        setFormData({ ...formData, agreedToTerms: e.target.checked });
                        if (fieldErrors.agreedToTerms) setFieldErrors({ ...fieldErrors, agreedToTerms: '' });
                      }}
                      required
                    />
                  }
                  label={
                    <span>
                      I certify that all information provided in this form is accurate and up to date. <span style={{ color: 'red' }}>*</span>
                    </span>
                  }
                />
                {fieldErrors.agreedToTerms && (
                  <Typography variant="caption" color="error" sx={{ ml: 4, display: 'block' }}>{fieldErrors.agreedToTerms}</Typography>
                )}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ border: fieldErrors.signature ? '1px solid #d32f2f' : 'none', borderRadius: 1, p: fieldErrors.signature ? 1 : 0 }}>
                <SignaturePad
                  label="Your Signature"
                  value={formData.signature}
                  onChange={(sig) => {
                    setFormData({ ...formData, signature: sig });
                    if (fieldErrors.signature) setFieldErrors({ ...fieldErrors, signature: '' });
                  }}
                />
                {fieldErrors.signature && (
                  <Typography variant="caption" color="error">{fieldErrors.signature}</Typography>
                )}
              </Box>
            </Grid>

            {isMinor() && (
              <Grid item xs={12} sm={6}>
                <Box sx={{ border: fieldErrors.parentSignature ? '1px solid #d32f2f' : 'none', borderRadius: 1, p: fieldErrors.parentSignature ? 1 : 0 }}>
                  <SignaturePad
                    label="Parent/Guardian Signature (Required for minors)"
                    value={formData.parentSignature}
                    onChange={(sig) => {
                      setFormData({ ...formData, parentSignature: sig });
                      if (fieldErrors.parentSignature) setFieldErrors({ ...fieldErrors, parentSignature: '' });
                    }}
                  />
                  {fieldErrors.parentSignature && (
                    <Typography variant="caption" color="error">{fieldErrors.parentSignature}</Typography>
                  )}
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              <Alert severity="info">
                Registration Date: {new Date().toLocaleDateString('en-NL')}
              </Alert>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <PageLayout>
    <Box
      sx={{
        minHeight: 'calc(100vh - 200px)',
        py: { xs: 2, sm: 4 },
      }}
    >
      <Container maxWidth="md">
        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 2, sm: 4 }, 
            borderRadius: 2,
            mx: { xs: -1, sm: 0 },
          }}
        >
          <Box textAlign="center" mb={{ xs: 2, sm: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom color="primary">
              Blue Mind Freediving
            </Typography>
            <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Member Registration
            </Typography>
          </Box>

          {/* Mobile-friendly stepper */}
          <Stepper 
            activeStep={activeStep} 
            sx={{ 
              mb: { xs: 2, sm: 4 },
              '& .MuiStepConnector-line': {
                minWidth: { xs: 12, sm: 24 },
              },
            }}
            alternativeLabel={isMobile}
          >
            {steps.map((step, index) => (
              <Step 
                key={step.label}
                sx={{
                  cursor: index < activeStep ? 'pointer' : 'default',
                  '& .MuiStepLabel-root': {
                    cursor: index < activeStep ? 'pointer' : 'default',
                  },
                  px: { xs: 0, sm: 1 },
                }}
                onClick={() => handleStepClick(index)}
              >
                <StepLabel
                  sx={{
                    '& .MuiStepLabel-label': {
                      fontSize: { xs: '0.65rem', sm: '0.875rem' },
                      mt: { xs: 0.5, sm: 0 },
                    },
                    '&:hover': index < activeStep ? {
                      '& .MuiStepLabel-label': {
                        color: 'primary.main',
                      }
                    } : {}
                  }}
                >
                  {isMobile ? step.short : step.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {renderStepContent(activeStep)}

          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              mt: { xs: 3, sm: 4 },
              gap: 2,
            }}
          >
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              variant="outlined"
              sx={{ minWidth: { xs: 80, sm: 100 } }}
            >
              Back
            </Button>
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                  size={isMobile ? 'medium' : 'large'}
                  sx={{ minWidth: { xs: 120, sm: 180 } }}
                >
                  {loading ? 'Submitting...' : (isMobile ? 'Submit' : 'Submit Registration')}
                </Button>
              ) : (
                <Button 
                  variant="contained" 
                  onClick={handleNext} 
                  size={isMobile ? 'medium' : 'large'}
                  sx={{ minWidth: { xs: 80, sm: 100 } }}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>

          <Box textAlign="center" mt={3}>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link to="/" style={{ color: '#0A4D68', textDecoration: 'none', fontWeight: 500 }}>
                Login here
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
    </PageLayout>
  );
};

export default RegistrationForm;
