import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme/theme';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import Login from './pages/Login';
import RegistrationForm from './pages/RegistrationForm';
import PendingApproval from './pages/PendingApproval';
import Unauthorized from './pages/Unauthorized';

// Document pages
import HouseRules from './pages/documents/HouseRules';
import LiabilityWaiver from './pages/documents/LiabilityWaiver';
import PrivacyPolicy from './pages/documents/PrivacyPolicy';

// Admin pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import MemberManagement from './pages/admin/MemberManagement';
import SessionManagement from './pages/admin/SessionManagement';
import AttendanceTracking from './pages/admin/AttendanceTracking';
import PaymentVerification from './pages/admin/PaymentVerification';
import ContentManagement from './pages/admin/ContentManagement';

// Member pages
import MemberLayout from './pages/member/MemberLayout';
import MemberDashboard from './pages/member/MemberDashboard';
import SessionBooking from './pages/member/SessionBooking';
import MemberPayments from './pages/member/MemberPayments';
import PersonalBests from './pages/member/PersonalBests';
import MemberProfile from './pages/member/MemberProfile';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <HashRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<RegistrationForm />} />
            <Route path="/pending-approval" element={<PendingApproval />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Document Routes - Public */}
            <Route path="/documents/house-rules" element={<HouseRules />} />
            <Route path="/documents/liability-waiver" element={<LiabilityWaiver />} />
            <Route path="/documents/privacy-policy" element={<PrivacyPolicy />} />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="members" element={<MemberManagement />} />
              <Route path="sessions" element={<SessionManagement />} />
              <Route path="attendance" element={<AttendanceTracking />} />
              <Route path="payments" element={<PaymentVerification />} />
              <Route path="content" element={<ContentManagement />} />
              <Route path="profile" element={<MemberProfile />} />
            </Route>

            {/* Member Routes */}
            <Route
              path="/member"
              element={
                <ProtectedRoute requiredRole="member">
                  <MemberLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<MemberDashboard />} />
              <Route path="booking" element={<SessionBooking />} />
              <Route path="payments" element={<MemberPayments />} />
              <Route path="personal-bests" element={<PersonalBests />} />
              <Route path="profile" element={<MemberProfile />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
