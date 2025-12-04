import React from 'react';
import { Box, Container, Typography, Link, Stack } from '@mui/material';
import InstagramIcon from '@mui/icons-material/Instagram';
import logoLight from '../assetes/logo-light.png'; // Grayscale logo for footer

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#0A4D68',
        color: 'white',
        py: 4,
        mt: 'auto',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={3}
          alignItems="center"
          justifyContent="space-between"
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <img 
              src={logoLight}
              alt="Blue Mind Freediving"
              style={{ height: '40px', opacity: 0.8 }}
            />
          </Box>
          
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems="center"
          >
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              © {new Date().getFullYear()} Blue Mind Freediving
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              KVK number: 96935685
            </Typography>
          </Stack>
          
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Follow us
            </Typography>
            <Link
              href="https://www.instagram.com/bluemind.freediving/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                '&:hover': {
                  color: '#00A9A5',
                },
              }}
            >
              <InstagramIcon />
            </Link>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;
