import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Dashboard,
  Event,
  Payment,
  EmojiEvents,
  Person,
} from '@mui/icons-material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const drawerWidth = 240;

const MemberLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const { userData, currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchPhoto = async () => {
      if (currentUser) {
        try {
          const memberDoc = await getDoc(doc(db, 'members', currentUser.uid));
          if (memberDoc.exists()) {
            setPhotoUrl(memberDoc.data().photoUrl);
          }
        } catch (e) {
          // Ignore
        }
      }
    };
    fetchPhoto();
  }, [currentUser]);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/member' },
    { text: 'Book Sessions', icon: <Event />, path: '/member/booking' },
    { text: 'Payments', icon: <Payment />, path: '/member/payments' },
    { text: 'Personal Bests', icon: <EmojiEvents />, path: '/member/personal-bests' },
    { text: 'My Profile', icon: <Person />, path: '/member/profile' },
  ];

  const drawer = (
    <Box>
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
        <Typography variant="h6" color="primary" fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          Member Panel
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setDrawerOpen(false);
              }}
              sx={{ py: { xs: 1.5, sm: 1 } }}
            >
              <ListItemIcon sx={{ minWidth: { xs: 40, sm: 56 } }}>{item.icon}</ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header 
        showMenuButton 
        onMenuToggle={handleDrawerToggle}
        userData={userData ? { ...userData, photoUrl } : null}
        onSignOut={handleSignOut}
      />
      <Box sx={{ display: 'flex', flex: 1 }}>
        <Drawer
          variant={isMobile ? 'temporary' : 'persistent'}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            width: drawerOpen && !isMobile ? drawerWidth : 0,
            flexShrink: 0,
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              top: isMobile ? 0 : '70px',
              height: isMobile ? '100vh' : 'calc(100vh - 70px)',
              transition: 'width 0.2s ease-in-out',
            },
          }}
        >
          {drawer}
        </Drawer>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            bgcolor: 'background.default',
            minHeight: 'calc(100vh - 70px)',
            transition: 'margin-left 0.2s ease-in-out',
            width: '100%',
          }}
        >
          <Outlet />
        </Box>
      </Box>
      <Footer />
    </Box>
  );
};

export default MemberLayout;
