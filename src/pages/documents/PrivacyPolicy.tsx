import React from 'react';
import { Container, Paper, Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';
import DynamicDocument from '../../components/DynamicDocument';
import PageLayout from '../../components/PageLayout';

const PrivacyPolicyContent: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 4 }}>
      <Container maxWidth="md">
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        
        <Paper elevation={2} sx={{ p: 4 }}>
          <Typography variant="h3" gutterBottom color="primary" align="center">
            Blue Mind Freediving
          </Typography>
          <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
            Privacy Policy
          </Typography>

          <Typography variant="body2" color="text.secondary" paragraph>
            Effective Date: December 2025
          </Typography>

          <Typography paragraph>
            Blue Mind Freediving is an informal freediving club in the Netherlands. This Privacy Policy explains 
            how we collect, use, store, and protect your personal data in compliance with the General Data Protection 
            Regulation (GDPR) and other relevant data protection laws.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            1. Who We Are
          </Typography>
          <Typography paragraph>
            Blue Mind Freediving is a club that organizes freediving training sessions and events. We are committed 
            to protecting your privacy and ensuring that your personal data is handled responsibly.
          </Typography>
          <Typography paragraph component="div">
            <strong>Contact Information:</strong>
            <br />
            Email: bluemindfreediving@gmail.com
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            2. What Personal Data We Collect
          </Typography>
          <Typography paragraph>
            When you become a member or participate in our activities, we may collect the following personal data:
          </Typography>
          <Typography paragraph component="div">
            <strong>Identity and Contact Information:</strong>
            <br />
            • Full name and nickname (if provided)
            <br />
            • Date of birth
            <br />
            • Email address
            <br />
            • Phone number
            <br />
            • Home address
            <br />
            <br />
            <strong>Emergency Contact Information:</strong>
            <br />
            • Name and phone number of emergency contact
            <br />
            • Relationship to emergency contact
            <br />
            <br />
            <strong>Health and Safety Data:</strong>
            <br />
            • Proof of health insurance valid in the Netherlands
            <br />
            • Medical declarations (only if relevant to freediving safety)
            <br />
            <br />
            <strong>Freediving Information:</strong>
            <br />
            • Freediving certifications (organization, level, date)
            <br />
            • Personal best records (STA, DYN, DYNBIFI, DNF, CWT, CWTB, CNF)
            <br />
            <br />
            <strong>Media Consent:</strong>
            <br />
            • Your consent regarding the use of photos or videos taken during training or events
            <br />
            <br />
            <strong>Safety and Training Records:</strong>
            <br />
            • Valid CPR and/or First Aid certifications (if applicable)
            <br />
            • Incident reports (only if necessary for safety purposes)
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            3. Why We Collect and Use Your Data
          </Typography>
          <Typography paragraph>
            We process your personal data for the following purposes:
          </Typography>
          <Typography paragraph component="div">
            <strong>Membership Administration:</strong>
            <br />
            • To manage your membership and communicate with you about club activities
            <br />
            <br />
            <strong>Safety and Emergency:</strong>
            <br />
            • To verify that you have adequate insurance
            <br />
            • To contact your emergency contact in case of an incident
            <br />
            • To comply with legal and regulatory requirements related to safety
            <br />
            <br />
            <strong>Communication:</strong>
            <br />
            • To send you updates, training schedules, and important announcements
            <br />
            <br />
            <strong>Media (with your consent):</strong>
            <br />
            • To share photos or videos on our website, social media, or promotional materials
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            4. Legal Basis for Processing Your Data
          </Typography>
          <Typography paragraph>
            We process your data based on:
          </Typography>
          <Typography paragraph component="div">
            • <strong>Explicit Consent:</strong> For sensitive data like medical declarations and media use
            <br />
            • <strong>Legitimate Interest:</strong> For membership management, safety protocols, and communication
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            5. Who Has Access to Your Data
          </Typography>
          <Typography paragraph>
            Your personal data is only accessible to:
          </Typography>
          <Typography paragraph component="div">
            • <strong>Board Members:</strong> For administrative purposes
            <br />
            • <strong>Emergency Services:</strong> If there is a medical or safety emergency
            <br />
            • <strong>Legal Authorities:</strong> If required by law
          </Typography>
          <Typography paragraph>
            We do not sell or share your data with third parties for marketing purposes.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            6. How We Store and Protect Your Data
          </Typography>
          <Typography paragraph component="div">
            • Your data is stored digitally and is password-protected
            <br />
            • We use secure cloud storage (Firebase/Google Cloud Platform) with encryption
            <br />
            • Access is limited to authorized board members only
            <br />
            • We take reasonable measures to prevent unauthorized access or data breaches
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            7. How Long We Keep Your Data
          </Typography>
          <Typography paragraph>
            We retain your personal data for as long as you are an active member. After your membership ends:
          </Typography>
          <Typography paragraph component="div">
            • <strong>Most personal data:</strong> Deleted within 3 months after membership termination
            <br />
            • <strong>Financial or legal records:</strong> Retained if required by law
            <br />
            • <strong>Incident reports:</strong> Retained longer for safety and liability purposes
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            8. Your Rights Under GDPR
          </Typography>
          <Typography paragraph>
            You have the following rights regarding your personal data:
          </Typography>
          <Typography paragraph component="div">
            • <strong>Right to Access:</strong> You can request a copy of the data we hold about you
            <br />
            • <strong>Right to Rectification:</strong> You can ask us to correct inaccurate or incomplete data
            <br />
            • <strong>Right to Erasure ("Right to be Forgotten"):</strong> You can request that we delete your data 
            (unless we are legally required to keep it)
            <br />
            • <strong>Right to Withdraw Consent:</strong> You can withdraw consent at any time (e.g., for media use)
            <br />
            • <strong>Right to Object:</strong> You can object to certain types of processing
            <br />
            • <strong>Right to Data Portability:</strong> You can request your data in a structured, commonly used format
          </Typography>
          <Typography paragraph>
            To exercise any of these rights, contact us at: <strong>bluemindfreediving@gmail.com</strong>
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            9. Changes to This Privacy Policy
          </Typography>
          <Typography paragraph>
            We may update this Privacy Policy from time to time. If we make significant changes, we will notify 
            members via email or announcements.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            10. Questions or Complaints
          </Typography>
          <Typography paragraph>
            If you have any questions or concerns about how we handle your data, please contact us at:
            <br />
            <br />
            <strong>Email:</strong> bluemindfreediving@gmail.com
          </Typography>
          <Typography paragraph>
            If you believe we have not handled your data correctly, you have the right to lodge a complaint with 
            the Dutch Data Protection Authority (Autoriteit Persoonsgegevens):
            <br />
            <br />
            <strong>Website:</strong> autoriteitpersoonsgegevens.nl
          </Typography>

          <Box sx={{ mt: 4, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Your Privacy Matters:</strong> We are committed to protecting your personal information 
              and complying with GDPR and Dutch data protection laws. If you have any concerns, please contact 
              us at bluemindfreediving@gmail.com
            </Typography>
          </Box>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Last updated: December 2025
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

const PrivacyPolicy: React.FC = () => {
  return (
    <PageLayout>
      <DynamicDocument pageId="privacy-policy" fallbackContent={<PrivacyPolicyContent />} />
    </PageLayout>
  );
};

export default PrivacyPolicy;
