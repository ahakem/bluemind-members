import React from 'react';
import { AppBar, Toolbar, Box, Container, IconButton, Avatar, Menu, MenuItem, Typography, Divider, ListItemIcon } from '@mui/material';
import { Menu as MenuIcon, Logout, Person } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import logo from '../assetes/logo.png';

interface HeaderProps {
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
  userData?: {
    name?: string;
    email?: string;
    role?: string;
  } | null;
  onSignOut?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, showMenuButton, userData, onSignOut }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const navigate = useNavigate();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    handleMenuClose();
    // Navigate to profile based on user role
    if (userData?.role === 'admin' || userData?.role === 'super-admin' || userData?.role === 'coach') {
      navigate('/admin/profile');
    } else {
      navigate('/member/profile');
    }
  };

  const handleSignOut = () => {
    handleMenuClose();
    onSignOut?.();
  };

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Container maxWidth={false}>
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: '70px' }}>
          {/* Left side - Menu button for admin/member */}
          <Box sx={{ width: 48, display: 'flex', justifyContent: 'flex-start' }}>
            {showMenuButton && (
              <IconButton
                color="primary"
                edge="start"
                onClick={onMenuToggle}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Box>

          {/* Center - Logo */}
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
            }}
          >
            <img 
              src={logo} 
              alt="Blue Mind Freediving" 
              style={{ 
                height: '50px',
                width: 'auto',
              }} 
            />
          </Box>

          {/* Right side - User avatar */}
          <Box sx={{ width: 48, display: 'flex', justifyContent: 'flex-end' }}>
            {userData && (
              <>
                <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36 }}>
                    {userData?.name?.charAt(0).toUpperCase() || userData?.email?.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  <MenuItem disabled>
                    <Typography variant="body2">{userData?.email}</Typography>
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleProfileClick}>
                    <ListItemIcon>
                      <Person fontSize="small" />
                    </ListItemIcon>
                    My Profile
                  </MenuItem>
                  <MenuItem onClick={handleSignOut}>
                    <ListItemIcon>
                      <Logout fontSize="small" />
                    </ListItemIcon>
                    Sign Out
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
