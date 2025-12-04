import React from 'react';
import { Container, Paper, Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';
import DynamicDocument from '../../components/DynamicDocument';
import PageLayout from '../../components/PageLayout';

const LiabilityWaiverContent: React.FC = () => {
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
            Liability Waiver & Release Form
          </Typography>

          <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1, mb: 3 }}>
            <Typography variant="body1" fontWeight="bold">
              IMPORTANT: READ CAREFULLY BEFORE SIGNING
            </Typography>
          </Box>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Introduction
          </Typography>
          <Typography paragraph>
            This Liability Waiver and Release Form is designed to inform all people diving with Blue Mind Freediving 
            of the risks involved in freediving and to clarify the responsibilities of each individual when engaging 
            in freediving activities under the auspices of Blue Mind Freediving. By signing this form, you acknowledge 
            and accept the inherent risks associated with freediving and agree to release the association from liability.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Assumption of Risk
          </Typography>
          <Typography paragraph>
            I, the undersigned, fully understand and acknowledge that freediving, including but not limited to training, 
            recreational diving, and all related activities, is an inherently dangerous activity that involves physical 
            risks. These risks include, but are not limited to:
          </Typography>
          <Typography paragraph component="div">
            • Shallow and deep water blackouts
            <br />
            • Decompression sickness
            <br />
            • Drowning
            <br />
            • Hypoxia or hyperoxia
            <br />
            • Injury caused by physical exertion or pressure changes
            <br />
            • Equipment failure
            <br />
            • Collisions with underwater obstacles
          </Typography>
          <Typography paragraph>
            I acknowledge that I am voluntarily participating in freediving activities, fully aware of the associated risks. 
            I also understand that my safety depends on my compliance with the rules and regulations of Blue Mind Freediving.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Obligation to Obtain Insurance
          </Typography>
          <Typography paragraph>
            Everyone freediving with Blue Mind Freediving is required to have (standard) health insurance that is valid 
            in the Netherlands.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Exemption from Liability
          </Typography>
          <Typography paragraph>
            The Association and its officers, directors, and instructors will not be held liable for any injuries, losses, 
            or damages incurred during freediving activities. By becoming a member, each individual acknowledges that they 
            have voluntarily assumed the risks of freediving and that they have secured appropriate insurance to cover such risks.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Responsibility for Damages
          </Typography>
          <Typography paragraph>
            You agree to be held personally responsible for any damage you cause to facilities, equipment, or property 
            during my participation in Blue Mind Freediving activities, whether intentional or due to negligence. You 
            understand that you may be liable for the cost of repairs or replacements as assessed by the facility or club.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Responsibility for Ongoing Coverage
          </Typography>
          <Typography paragraph>
            You are responsible for ensuring that their insurance coverage remains valid and active throughout the duration 
            of their membership. The Association will not monitor or assume responsibility for any lapses in coverage. 
            Failure to provide proof of insurance may result in the suspension or termination of membership privileges.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Health & Medical Acknowledgement
          </Typography>
          <Typography paragraph>
            By signing you certify that:
            <br />
            • There are no medical conditions that could affect my ability to safely participate in freediving. If such 
            medical conditions do arise, you will not participate in any freediving activities of Blue Mind Freediving, 
            until these medical conditions have been resolved.
            <br />
            • You agree to consult with a healthcare provider before participating if you are unsure about your fitness 
            to participate in freediving.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Waiver of Liability and Release
          </Typography>
          <Typography paragraph>
            In consideration of being allowed to participate in freediving activities with Blue Mind Freediving, you, 
            for yourself, your heirs, executors, and assigns, hereby release, waive, and discharge Blue Mind Freediving, 
            its officers, instructors, agents, employees, volunteers, and affiliates from any and all liability for any 
            injury, loss, damage, or death arising out of or in connection with my participation in any freediving 
            activities organized by the association. This release applies to any claims for damages, injuries, or losses, 
            including those caused by the negligence of the association or its agents. You further agree to hold harmless 
            and indemnify Blue Mind Freediving and its representatives from any claims arising out of your participation 
            in freediving activities.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Acknowledgement of Safety Rules and Regulations
          </Typography>
          <Typography paragraph>
            You agree to follow all safety rules, guidelines, and instructions provided by Blue Mind Freediving, including 
            but not limited to:
            <br />
            • The buddy system
            <br />
            • Diving within your limits
            <br />
            • The prohibition of diving under the influence of alcohol or drugs
            <br />
            • The prohibition of diving with medical conditions that could affect the ability to safely participate in freediving
            <br />
            • The wearing of proper safety equipment
            <br />
            • Adherence to dive site regulations
          </Typography>
          <Typography paragraph>
            You understand that failure to comply with these rules may result in removal from the activity and/or membership 
            termination.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Acknowledgement of Understanding and Signature
          </Typography>
          <Typography paragraph>
            By signing below, you acknowledge that you have read and fully understand the contents of this waiver and 
            release form. You understand that you are waiving certain legal rights, including the right to sue Blue Mind 
            Freediving and its agents in the event of injury, loss, or damage. You certify that you are signing this 
            document voluntarily and without any undue influence.
          </Typography>

          <Box sx={{ mt: 4, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
            <Typography variant="body2" fontWeight="bold">
              This is a legal document that affects your rights. By registering and providing your signature, you 
              acknowledge that you have read, understood, and agree to the terms of this waiver.
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

const LiabilityWaiver: React.FC = () => {
  return (
    <PageLayout>
      <DynamicDocument pageId="liability-waiver" fallbackContent={<LiabilityWaiverContent />} />
    </PageLayout>
  );
};

export default LiabilityWaiver;
