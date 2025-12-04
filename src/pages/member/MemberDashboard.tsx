import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Event,
  CheckCircle,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Member, Session, Invoice } from '../../types';
import { format, differenceInDays } from 'date-fns';

const MemberDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [nextSession, setNextSession] = useState<Session | null>(null);
  const [pendingInvoice, setPendingInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchMemberData();
    }
  }, [currentUser]);

  const fetchMemberData = async () => {
    if (!currentUser) return;

    try {
      // Fetch member data
      const memberDoc = await getDoc(doc(db, 'members', currentUser.uid));
      if (memberDoc.exists()) {
        const memberData = {
          ...memberDoc.data(),
          medicalCertificate: {
            ...memberDoc.data().medicalCertificate,
            expiryDate: memberDoc.data().medicalCertificate?.expiryDate?.toDate(),
          },
          membershipExpiry: memberDoc.data().membershipExpiry?.toDate(),
        } as Member;
        setMember(memberData);
      }

      // Fetch next session
      const now = Timestamp.now();
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('date', '>=', now)
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessions = sessionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
      })) as Session[];
      
      if (sessions.length > 0) {
        sessions.sort((a, b) => a.date.getTime() - b.date.getTime());
        setNextSession(sessions[0]);
      }

      // Fetch pending invoice
      const invoicesQuery = query(
        collection(db, 'invoices'),
        where('memberId', '==', currentUser.uid),
        where('status', 'in', ['pending', 'transfer_initiated'])
      );
      const invoicesSnapshot = await getDocs(invoicesQuery);
      if (!invoicesSnapshot.empty) {
        const invoiceData = {
          id: invoicesSnapshot.docs[0].id,
          ...invoicesSnapshot.docs[0].data(),
          dueDate: invoicesSnapshot.docs[0].data().dueDate?.toDate(),
        } as Invoice;
        setPendingInvoice(invoiceData);
      }
    } catch (error) {
      console.error('Error fetching member data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LinearProgress />;
  }

  const getMembershipDaysRemaining = () => {
    if (!member?.membershipExpiry) return 0;
    return differenceInDays(member.membershipExpiry, new Date());
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome, {member?.name}!
      </Typography>

      {pendingInvoice && (
        <Alert severity="warning" sx={{ mb: 2 }} icon={<PaymentIcon />}>
          You have a pending payment. Please complete the payment to maintain your membership.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Membership Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <CheckCircle sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h6">Membership Status</Typography>
                  <Chip
                    label={member?.membershipStatus || 'N/A'}
                    color={member?.membershipStatus === 'active' ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>
              </Box>
              {member?.membershipExpiry && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Expires: {format(member.membershipExpiry, 'MMMM d, yyyy')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ({getMembershipDaysRemaining()} days remaining)
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Next Session */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Event sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
                <Typography variant="h6">Next Session</Typography>
              </Box>
              {nextSession ? (
                <Box>
                  <Typography variant="body1" gutterBottom>
                    <strong>{format(nextSession.date, 'EEEE, MMMM d, yyyy')}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ⏰ {nextSession.startTime} - {nextSession.endTime}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    📍 {nextSession.location}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Type: {nextSession.type.replace('_', ' ')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Capacity: {nextSession.currentAttendance}/{nextSession.capacity}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No upcoming sessions scheduled.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MemberDashboard;
