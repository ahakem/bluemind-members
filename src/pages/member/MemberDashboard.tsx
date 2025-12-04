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
  useMediaQuery,
  useTheme,
  Avatar,
  AvatarGroup,
  Tooltip,
} from '@mui/material';
import {
  Event,
  CheckCircle,
  Payment as PaymentIcon,
  People,
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

interface Attendee {
  id: string;
  memberName: string;
  photoUrl?: string;
}

const MemberDashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { currentUser } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [nextSession, setNextSession] = useState<Session | null>(null);
  const [nextSessionAttendees, setNextSessionAttendees] = useState<Attendee[]>([]);
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
        const nextSess = sessions[0];
        setNextSession(nextSess);
        
        // Fetch attendees for next session
        const attendanceQuery = query(
          collection(db, 'attendance'),
          where('sessionId', '==', nextSess.id)
        );
        const attendanceSnapshot = await getDocs(attendanceQuery);
        const attendees: Attendee[] = [];
        for (const attDoc of attendanceSnapshot.docs) {
          const attData = attDoc.data();
          // Only include confirmed or attended status
          if (attData.status !== 'confirmed' && attData.status !== 'attended') {
            continue;
          }
          attendees.push({
            id: attDoc.id,
            memberName: attData.memberName,
            photoUrl: attData.memberPhotoUrl || undefined,
          });
        }
        setNextSessionAttendees(attendees);
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
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Avatar 
          src={member?.photoUrl || undefined} 
          sx={{ 
            width: 56, 
            height: 56,
            bgcolor: 'primary.main',
            fontSize: '1.5rem',
          }}
        >
          {!member?.photoUrl && member?.name?.charAt(0).toUpperCase()}
        </Avatar>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Welcome, {member?.name?.split(' ')[0]}!
        </Typography>
      </Box>

      {pendingInvoice && (
        <Alert severity="warning" sx={{ mb: 2, fontSize: { xs: '0.8rem', sm: '0.875rem' } }} icon={<PaymentIcon />}>
          You have a pending payment.
        </Alert>
      )}

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Membership Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box display="flex" alignItems="center" mb={2}>
                <CheckCircle sx={{ fontSize: { xs: 32, sm: 40 }, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>Membership Status</Typography>
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
                    Expires: {format(member.membershipExpiry, isMobile ? 'MMM d, yyyy' : 'MMMM d, yyyy')}
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
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Event sx={{ fontSize: { xs: 32, sm: 40 }, color: 'secondary.main', mr: 2 }} />
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>Next Session</Typography>
              </Box>
              {nextSession ? (
                <Box>
                  <Typography variant="body1" gutterBottom sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                    <strong>{format(nextSession.date, isMobile ? 'EEE, MMM d' : 'EEEE, MMMM d, yyyy')}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ⏰ {nextSession.startTime} - {nextSession.endTime}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    📍 {nextSession.locationName || 'TBD'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Type: {nextSession.type.replace('_', ' ')}
                  </Typography>
                  
                  {/* Attendees */}
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <People fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {nextSessionAttendees.length} attending!!
                      </Typography>
                    </Box>
                    hello
                    {nextSessionAttendees.length > 0 && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <AvatarGroup max={isMobile ? 4 : 6} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '0.75rem' } }}>
                          {nextSessionAttendees.map((attendee) => (
                            <Tooltip key={attendee.id} title={attendee.memberName}>
                              <Avatar src={attendee.photoUrl || undefined} sx={{ bgcolor: 'primary.main' }}>
                                {!attendee.photoUrl && attendee.memberName.charAt(0).toUpperCase()}
                              </Avatar>
                            </Tooltip>
                          ))}
                        </AvatarGroup>
                        {!isMobile && nextSessionAttendees.length <= 3 && (
                          <Typography variant="caption" color="text.secondary">
                            {nextSessionAttendees.map(a => a.memberName.split(' ')[0]).join(', ')}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
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
