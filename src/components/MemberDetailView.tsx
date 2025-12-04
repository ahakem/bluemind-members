import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  Divider,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Person,
  LocationOn,
  ContactEmergency,
  HealthAndSafety,
  PhotoCamera,
  CardMembership,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { Member, User } from '../types';

interface MemberDetailViewProps {
  open: boolean;
  onClose: () => void;
  member: Member | null;
  user: User | null;
}

const MemberDetailView: React.FC<MemberDetailViewProps> = ({ open, onClose, member, user }) => {
  if (!member || !user) return null;

  const calculateAge = (dateOfBirth: any) => {
    if (!dateOfBirth || !dateOfBirth.toDate) return 'N/A';
    const birthDate = dateOfBirth.toDate();
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    return timestamp.toDate().toLocaleDateString('en-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const InfoSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({
    title,
    icon,
    children,
  }) => (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {icon}
        <Typography variant="h6" sx={{ ml: 1 }}>
          {title}
        </Typography>
      </Box>
      {children}
    </Box>
  );

  const InfoRow: React.FC<{ label: string; value: any }> = ({ label, value }) => (
    <Grid container spacing={2} sx={{ mb: 1 }}>
      <Grid item xs={5}>
        <Typography variant="body2" color="text.secondary" fontWeight="bold">
          {label}:
        </Typography>
      </Grid>
      <Grid item xs={7}>
        <Typography variant="body2">{value || 'N/A'}</Typography>
      </Grid>
    </Grid>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
            <Person fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h5">{member.name}</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              <Chip
                size="small"
                label={user.role}
                color={user.role === 'admin' ? 'secondary' : 'primary'}
              />
              <Chip
                size="small"
                label={user.approved ? 'Approved' : 'Pending'}
                color={user.approved ? 'success' : 'warning'}
              />
              <Chip
                size="small"
                label={member.membershipStatus}
                color={member.membershipStatus === 'active' ? 'success' : 'default'}
              />
            </Box>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Personal Information */}
        <InfoSection title="Personal Information" icon={<Person color="primary" />}>
          <InfoRow label="Full Name" value={member.name} />
          <InfoRow label="Email" value={member.email} />
          <InfoRow label="Phone" value={member.phone} />
          <InfoRow label="Date of Birth" value={formatDate(member.dateOfBirth)} />
          <InfoRow label="Age" value={calculateAge(member.dateOfBirth)} />
          {member.membershipNumber && (
            <InfoRow label="Membership Number" value={member.membershipNumber} />
          )}
          <InfoRow label="Registration Date" value={formatDate(member.registrationDate)} />
        </InfoSection>

        <Divider sx={{ my: 2 }} />

        {/* Address */}
        <InfoSection title="Address" icon={<LocationOn color="primary" />}>
          {member.address ? (
            <>
              <InfoRow label="Street" value={member.address.street} />
              <InfoRow label="City" value={member.address.city} />
              <InfoRow label="Postal Code" value={member.address.postalCode} />
              <InfoRow label="Country" value={member.address.country} />
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No address provided
            </Typography>
          )}
        </InfoSection>

        <Divider sx={{ my: 2 }} />

        {/* Emergency Contact */}
        <InfoSection title="Emergency Contact" icon={<ContactEmergency color="error" />}>
          {member.emergencyContact ? (
            <>
              <InfoRow label="Name" value={member.emergencyContact.name} />
              <InfoRow label="Phone" value={member.emergencyContact.phone} />
              <InfoRow label="Relationship" value={member.emergencyContact.relationship} />
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No emergency contact provided
            </Typography>
          )}
        </InfoSection>

        <Divider sx={{ my: 2 }} />

        {/* Health & Insurance */}
        <InfoSection title="Health & Insurance" icon={<HealthAndSafety color="primary" />}>
          <InfoRow
            label="Health Insurance"
            value={
              <Chip
                size="small"
                icon={member.hasInsurance ? <CheckCircle /> : <Cancel />}
                label={member.hasInsurance ? 'Yes' : 'No'}
                color={member.hasInsurance ? 'success' : 'error'}
              />
            }
          />
          <InfoRow
            label="Insurance Proof Provided"
            value={
              <Chip
                size="small"
                icon={member.insuranceProofProvided ? <CheckCircle /> : <Cancel />}
                label={member.insuranceProofProvided ? 'Yes' : 'No'}
                color={member.insuranceProofProvided ? 'success' : 'warning'}
              />
            }
          />
          <InfoRow
            label="Medical Certificate Status"
            value={
              <Chip
                size="small"
                label={member.medicalCertificate.status}
                color={member.medicalCertificate.status === 'valid' ? 'success' : 'error'}
              />
            }
          />
          {member.medicalCertificate.expiryDate && (
            <InfoRow
              label="Medical Cert Expiry"
              value={formatDate(member.medicalCertificate.expiryDate)}
            />
          )}
        </InfoSection>

        <Divider sx={{ my: 2 }} />

        {/* Certifications */}
        <InfoSection title="Freediving Certifications" icon={<CardMembership color="primary" />}>
          {member.certifications && member.certifications.length > 0 ? (
            member.certifications.map((cert, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <InfoRow label="Organization" value={cert.organization} />
                <InfoRow label="Level" value={cert.level} />
                {cert.documentUrl && (
                  <Box sx={{ mt: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      href={cert.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Certificate
                    </Button>
                  </Box>
                )}
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No certifications provided
            </Typography>
          )}
        </InfoSection>

        <Divider sx={{ my: 2 }} />

        {/* Consents & Certifications */}
        <InfoSection title="Consents & Agreements" icon={<CheckCircle color="primary" />}>
          <InfoRow
            label="Photography Consent"
            value={
              <Chip
                size="small"
                icon={member.photographyConsent ? <PhotoCamera /> : <Cancel />}
                label={member.photographyConsent ? 'Granted' : 'Not Granted'}
                color={member.photographyConsent ? 'success' : 'default'}
              />
            }
          />
          <InfoRow
            label="Emergency Responder"
            value={
              <Chip
                size="small"
                label={member.isEmergencyResponder ? 'Yes (CPR/First Aid/AED)' : 'No'}
                color={member.isEmergencyResponder ? 'success' : 'default'}
              />
            }
          />
          {member.emergencyResponderProof && (
            <InfoRow label="Emergency Responder Proof" value="Provided" />
          )}
        </InfoSection>

        <Divider sx={{ my: 2 }} />

        {/* Legal Agreements */}
        <InfoSection title="Legal Agreements" icon={<CheckCircle color="success" />}>
          <InfoRow
            label="Terms & Conditions"
            value={
              <Chip
                size="small"
                icon={member.agreedToTerms ? <CheckCircle /> : <Cancel />}
                label={member.agreedToTerms ? 'Agreed' : 'Not Agreed'}
                color={member.agreedToTerms ? 'success' : 'error'}
              />
            }
          />
          <InfoRow
            label="Liability Waiver"
            value={
              <Chip
                size="small"
                icon={member.agreedToLiabilityWaiver ? <CheckCircle /> : <Cancel />}
                label={member.agreedToLiabilityWaiver ? 'Signed' : 'Not Signed'}
                color={member.agreedToLiabilityWaiver ? 'success' : 'error'}
              />
            }
          />
          <InfoRow
            label="House Rules"
            value={
              <Chip
                size="small"
                icon={member.agreedToHouseRules ? <CheckCircle /> : <Cancel />}
                label={member.agreedToHouseRules ? 'Agreed' : 'Not Agreed'}
                color={member.agreedToHouseRules ? 'success' : 'error'}
              />
            }
          />
          <InfoRow
            label="Privacy Policy"
            value={
              <Chip
                size="small"
                icon={member.agreedToPrivacyPolicy ? <CheckCircle /> : <Cancel />}
                label={member.agreedToPrivacyPolicy ? 'Agreed' : 'Not Agreed'}
                color={member.agreedToPrivacyPolicy ? 'success' : 'error'}
              />
            }
          />
        </InfoSection>

        <Divider sx={{ my: 2 }} />

        {/* Signatures */}
        <InfoSection title="Signatures" icon={<CheckCircle color="primary" />}>
          {member.signature && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Member Signature:
              </Typography>
              <Box
                component="img"
                src={member.signature}
                alt="Member Signature"
                sx={{
                  maxWidth: '100%',
                  maxHeight: 150,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: 'white',
                }}
              />
            </Box>
          )}
          {member.parentSignature && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Parent/Guardian Signature (Minor):
              </Typography>
              <Box
                component="img"
                src={member.parentSignature}
                alt="Parent Signature"
                sx={{
                  maxWidth: '100%',
                  maxHeight: 150,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: 'white',
                }}
              />
            </Box>
          )}
          {!member.signature && (
            <Typography variant="body2" color="text.secondary">
              No signature captured
            </Typography>
          )}
        </InfoSection>

        <Divider sx={{ my: 2 }} />

        {/* Personal Bests */}
        <InfoSection title="Personal Bests" icon={<CardMembership color="primary" />}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <InfoRow label="STA" value={member.personalBests.STA || '-'} />
              <InfoRow label="DYN" value={member.personalBests.DYN || '-'} />
            </Grid>
            <Grid item xs={6}>
              <InfoRow label="DNF" value={member.personalBests.DNF || '-'} />
              <InfoRow label="CWT" value={member.personalBests.CWT || '-'} />
            </Grid>
          </Grid>
        </InfoSection>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MemberDetailView;
