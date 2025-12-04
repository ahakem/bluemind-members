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
} from '@mui/material';
import {
  Dashboard,
  People,
  Event,
  CheckCircle,
  Payment,
  Article,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const drawerWidth = 240;

const AdminLayout: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(true);
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

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/admin' },
    { text: 'Members', icon: <People />, path: '/admin/members' },
    { text: 'Sessions', icon: <Event />, path: '/admin/sessions' },
    { text: 'Attendance', icon: <CheckCircle />, path: '/admin/attendance' },
    { text: 'Payments', icon: <Payment />, path: '/admin/payments' },
    { text: 'Content', icon: <Article />, path: '/admin/content' },
  ];

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" color="primary" fontWeight="bold">
          Admin Panel
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
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
          variant="persistent"
          open={drawerOpen}
          sx={{
            width: drawerOpen ? drawerWidth : 0,
            flexShrink: 0,
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              top: '70px',
              height: 'calc(100vh - 70px)',
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
            p: 3,
            bgcolor: 'background.default',
            minHeight: 'calc(100vh - 70px)',
            transition: 'margin-left 0.2s ease-in-out',
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
