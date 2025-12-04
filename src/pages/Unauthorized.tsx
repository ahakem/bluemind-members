import React from 'react';
import { Box, Container, Paper, Typography, Button } from '@mui/material';
import { Block } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

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
          <Block sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Unauthorized Access
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            You do not have permission to access this page.
          </Typography>
          <Button variant="contained" onClick={() => navigate(-1)} sx={{ mt: 2 }}>
            Go Back
          </Button>
        </Paper>
      </Container>
    </Box>
    </PageLayout>
  );
};

export default Unauthorized;
