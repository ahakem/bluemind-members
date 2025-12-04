import React, { useEffect } from 'react';
import { Box, Container, Paper, Typography, Button } from '@mui/material';
import { HourglassEmpty } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';

const PendingApproval: React.FC = () => {
  const { signOut, userData } = useAuth();
  const navigate = useNavigate();

  // Watch for approval status changes and redirect when approved
  useEffect(() => {
    if (userData?.approved) {
      // Redirect to appropriate dashboard based on role
      if (userData.role === 'admin' || userData.role === 'super-admin' || userData.role === 'coach') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/member', { replace: true });
      }
    }
  }, [userData, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <PageLayout>
    <Box
      sx={{
        minHeight: 'calc(100vh - 200px)',
        display: 'flex',
        alignItems: 'center',
        py: 8,
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
          <HourglassEmpty sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Account Pending Approval
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Thank you for registering! Your account is currently pending approval from an
            administrator. You will be notified once your account has been approved.
          </Typography>
          <Button variant="outlined" onClick={handleSignOut} sx={{ mt: 2 }}>
            Sign Out
          </Button>
        </Paper>
      </Container>
    </Box>
    </PageLayout>
  );
};

export default PendingApproval;
