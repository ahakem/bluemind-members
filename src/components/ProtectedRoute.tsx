import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { Box, CircularProgress } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { currentUser, userData, loading } = useAuth();
  const location = useLocation();

  console.log('🔐 ProtectedRoute check:', {
    currentUser: currentUser?.email,
    userData,
    loading,
    approved: userData?.approved,
    role: userData?.role,
    requiredRole
  });

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!currentUser) {
    console.log('❌ No currentUser, redirecting to login');
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (!userData?.approved) {
    console.log('❌ Not approved:', userData?.approved, 'typeof:', typeof userData?.approved);
    console.log('Full userData:', JSON.stringify(userData, null, 2));
    return <Navigate to="/pending-approval" replace />;
  }

  console.log('✅ User is approved, checking role access');

  if (requiredRole) {
    const hasAccess =
      requiredRole === 'admin'
        ? userData.role === 'admin' || userData.role === 'coach' || userData.role === 'super-admin' || userData.role === 'board'
        : userData.role === requiredRole || userData.role === 'board';

    if (!hasAccess) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
