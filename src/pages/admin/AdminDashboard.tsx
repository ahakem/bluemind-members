import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Alert,
  Button,
} from '@mui/material';
import {
  People,
  Event,
  Payment,
  PersonAdd,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Member } from '../../types';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    upcomingSessions: 0,
    pendingUsers: 0,
    pendingPayments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch members
        const membersSnapshot = await getDocs(collection(db, 'members'));
        const members = membersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Member));
        
        const activeMembers = members.filter(m => m.membershipStatus === 'active').length;

        // Fetch pending users (not approved)
        const usersQuery = query(
          collection(db, 'users'),
          where('approved', '==', false)
        );
        const pendingUsersSnapshot = await getDocs(usersQuery);

        // Fetch upcoming sessions
        const now = Timestamp.now();
        const sessionsQuery = query(
          collection(db, 'sessions'),
          where('date', '>=', now)
        );
        const sessionsSnapshot = await getDocs(sessionsQuery);
        
        // Fetch pending payments
        const invoicesQuery = query(
          collection(db, 'invoices'),
          where('status', 'in', ['pending', 'transfer_initiated'])
        );
        const invoicesSnapshot = await getDocs(invoicesQuery);

        setStats({
          totalMembers: members.length,
          activeMembers,
          upcomingSessions: sessionsSnapshot.size,
          pendingUsers: pendingUsersSnapshot.size,
          pendingPayments: invoicesSnapshot.size,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Members',
      value: stats.totalMembers,
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#0A4D68',
    },
    {
      title: 'Active Members',
      value: stats.activeMembers,
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#00A9A5',
    },
    {
      title: 'Upcoming Sessions',
      value: stats.upcomingSessions,
      icon: <Event sx={{ fontSize: 40 }} />,
      color: '#388E3C',
    },
    {
      title: 'Pending Payments',
      value: stats.pendingPayments,
      icon: <Payment sx={{ fontSize: 40 }} />,
      color: '#F57C00',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {stats.pendingUsers > 0 && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3, py: 2 }} 
          icon={<PersonAdd sx={{ fontSize: 32 }} />}
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/admin/members')}>
              Review Now
            </Button>
          }
        >
          <Typography variant="h6" component="span">
            {stats.pendingUsers} new user{stats.pendingUsers > 1 ? 's' : ''} pending approval!
          </Typography>
          <Typography variant="body2">
            New registrations require your review before they can access the system.
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      {card.title}
                    </Typography>
                    <Typography variant="h4" sx={{ mt: 1 }}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: card.color }}>
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box mt={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Use the sidebar to navigate to different sections:
          </Typography>
          <ul>
            <li><strong>Members:</strong> Manage member profiles, certifications, and medical certificates</li>
            <li><strong>Sessions:</strong> Schedule and manage training sessions</li>
            <li><strong>Attendance:</strong> Track member attendance for sessions</li>
            <li><strong>Payments:</strong> Verify bank transfers and manage invoices</li>
          </ul>
        </Paper>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
