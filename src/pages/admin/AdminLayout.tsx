import React, { useState } from 'react';
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
  People,
  Event,
  CheckCircle,
  Payment,
  Article,
  CalendarMonth,
  EmojiEvents,
  Receipt,
  LocationOn,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const drawerWidth = 240;

const AdminLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const { userData, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Member menu items (available to all)
  const memberMenuItems = [
    { text: 'My Dashboard', icon: <Dashboard />, path: '/admin/my-dashboard' },
    { text: 'Book Sessions', icon: <CalendarMonth />, path: '/admin/booking' },
    { text: 'My Payments', icon: <Receipt />, path: '/admin/my-payments' },
    { text: 'Personal Bests', icon: <EmojiEvents />, path: '/admin/personal-bests' },
  ];

  // Admin-only menu items
  const adminMenuItems = [
    { text: 'Admin Dashboard', icon: <Dashboard />, path: '/admin' },
    { text: 'Members', icon: <People />, path: '/admin/members' },
    { text: 'Sessions', icon: <Event />, path: '/admin/sessions' },
    { text: 'Locations & Bank', icon: <LocationOn />, path: '/admin/locations' },
    { text: 'Attendance', icon: <CheckCircle />, path: '/admin/attendance' },
    { text: 'Payments', icon: <Payment />, path: '/admin/payments' },
    { text: 'Content', icon: <Article />, path: '/admin/content' },
  ];

  const drawer = (
    <Box>
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
        <Typography variant="h6" color="primary" fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          Blue Mind
        </Typography>
      </Toolbar>
      <Divider />
      {/* Member Section */}
      <List>
        {memberMenuItems.map((item) => (
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
                primaryTypographyProps={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      {/* Admin Section */}
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="caption" color="text.secondary" fontWeight="bold">
          MANAGEMENT
        </Typography>
      </Box>
      <List>
        {adminMenuItems.map((item) => (
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
                primaryTypographyProps={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}
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
        userData={userData}
        onSignOut={handleSignOut}
      />
      <Box sx={{ display: 'flex', flex: 1 }}>
        <Drawer
          variant={isMobile ? 'temporary' : 'persistent'}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          ModalProps={{
            keepMounted: true,
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

export default AdminLayout;
