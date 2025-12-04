import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import PageLayout from '../components/PageLayout';
import logoLight from '../assetes/logo-light.png';

const Login: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, currentUser, userData } = useAuth();
  const navigate = useNavigate();

  // Handle navigation after user data is loaded
  useEffect(() => {
    if (currentUser && userData) {
      console.log('🚀 Login: User authenticated, navigating...', { userData });
      
      if (!userData.approved) {
        navigate('/pending-approval');
      } else if (userData.role === 'admin' || userData.role === 'coach' || userData.role === 'super-admin') {
        navigate('/admin');
      } else {
        navigate('/member');
      }
    }
  }, [currentUser, userData, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      // Navigation will happen automatically via useEffect above
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <Box
        sx={{
          minHeight: 'calc(100vh - 200px)',
          display: 'flex',
          alignItems: 'center',
          py: { xs: 4, sm: 8 },
          px: { xs: 1, sm: 2 },
        }}
      >
        <Container maxWidth="sm">
          <Paper 
            elevation={3} 
            sx={{ 
              p: { xs: 3, sm: 4 }, 
              borderRadius: 2,
            }}
          >
            <Box textAlign="center" mb={3}>
              <img 
                src={logoLight} 
                alt="Blue Mind Freediving" 
                style={{ 
                  height: isMobile ? '60px' : '80px',
                  marginBottom: isMobile ? '12px' : '20px',
                }} 
              />
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom 
                color="primary"
                sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
              >
                Member Login
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Access your Blue Mind Freediving account
              </Typography>
            </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoComplete="email"
              inputProps={{ inputMode: 'email' }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="current-password"
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <Box textAlign="center" mt={2}>
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link component={RouterLink} to="/register" underline="hover">
                Register here
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
    </PageLayout>
  );
};

export default Login;
