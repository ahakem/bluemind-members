import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
  Avatar,
  AvatarGroup,
  Tooltip,
} from '@mui/material';
import { Event, People, LocationOn, Euro, Payment } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  deleteDoc,
  doc,
  Timestamp,
  updateDoc,
  increment,
  getDoc,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Session, Invoice, Member } from '../../types';
import { format, startOfDay } from 'date-fns';

interface BookingInfo {
  sessionId: string;
  attendanceId: string;
  invoiceId?: string;
  invoiceStatus?: string;
  paymentMethod?: string;
}

interface SessionAttendee {
  id: string;
  memberName: string;
  photoUrl?: string;
}

const SessionBooking: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userData } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [myBookings, setMyBookings] = useState<BookingInfo[]>([]);
  const [sessionAttendees, setSessionAttendees] = useState<Record<string, SessionAttendee[]>>({});
  const [memberData, setMemberData] = useState<Member | null>(null);
  const [, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; session: Session | null }>({
    open: false,
    session: null,
  });

  // Determine if we're in admin context
  const isAdminContext = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (currentUser) {
      fetchSessions();
      fetchMemberData();
    }
  }, [currentUser]);

  const fetchMemberData = async () => {
    if (!currentUser) return;
    try {
      const memberDoc = await getDoc(doc(db, 'members', currentUser.uid));
      if (memberDoc.exists()) {
        setMemberData({ uid: memberDoc.id, ...memberDoc.data() } as Member);
      }
    } catch (e) {
      console.error('Error fetching member data:', e);
    }
  };

  const fetchSessions = async () => {
    if (!currentUser) return;

    try {
      setError('');
      const now = new Date();
      
      // Fetch all future sessions
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('date', '>=', Timestamp.fromDate(startOfDay(now)))
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessionsList = sessionsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate(),
          repeatEndDate: data.repeatEndDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
        };
      }) as Session[];

      setSessions(sessionsList.sort((a, b) => a.date.getTime() - b.date.getTime()));

      // Fetch attendees for all sessions
      const attendeesMap: Record<string, SessionAttendee[]> = {};
      for (const sess of sessionsList) {
        const sessionAttQuery = query(
          collection(db, 'attendance'),
          where('sessionId', '==', sess.id)
        );
        const sessionAttSnapshot = await getDocs(sessionAttQuery);
        const attendees: SessionAttendee[] = [];
        for (const attDoc of sessionAttSnapshot.docs) {
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
        attendeesMap[sess.id] = attendees;
      }
      setSessionAttendees(attendeesMap);

      // Fetch my bookings
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('memberId', '==', currentUser.uid)
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      
      // Get invoice statuses for each booking
      const bookingsWithStatus: BookingInfo[] = await Promise.all(
        attendanceSnapshot.docs
          .filter(doc => doc.data().status === 'confirmed')
          .map(async (attendanceDoc) => {
            const data = attendanceDoc.data();
            let invoiceStatus = 'pending';
            
            if (data.invoiceId) {
              try {
                const invoiceDoc = await getDoc(doc(db, 'invoices', data.invoiceId));
                if (invoiceDoc.exists()) {
                  invoiceStatus = invoiceDoc.data().status;
                }
              } catch (e) {
                console.error('Error fetching invoice:', e);
              }
            }
            
            return {
              sessionId: data.sessionId,
              attendanceId: attendanceDoc.id,
              invoiceId: data.invoiceId,
              invoiceStatus,
              paymentMethod: data.paymentMethod || 'invoice',
            };
          })
      );
      
      setMyBookings(bookingsWithStatus);
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
      setError(error.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const generatePaymentReference = () => {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `BM-${year}-${random}`;
  };

  const getPrice = (session: Session) => {
    // Long-term members get free sessions
    if (memberData?.isLongTermMember) {
      return 0;
    }
    // Check if user is board member (separate flag, not a role)
    const isBoardMember = userData?.isBoardMember || false;
    return isBoardMember ? (session.priceBoard || 0) : (session.priceMember || 0);
  };

  const getPaymentMethod = (session: Session): 'long_term' | 'balance' | 'invoice' | 'free' => {
    const price = getPrice(session);
    
    // Free session
    if (price === 0) {
      return memberData?.isLongTermMember ? 'long_term' : 'free';
    }
    
    // Has enough balance - pay from balance
    if (memberData?.balance && memberData.balance >= price) {
      return 'balance';
    }
    
    // Otherwise, create invoice
    return 'invoice';
  };

  const handleOpenConfirmDialog = (session: Session) => {
    setConfirmDialog({ open: true, session });
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialog({ open: false, session: null });
  };

  const handleBooking = async () => {
    if (!currentUser || !userData || !confirmDialog.session) return;

    const session = confirmDialog.session;
    
    try {
      setError('');
      setSuccess('');

      // Check if already booked (prevent duplicates) - local state check
      const existingBooking = myBookings.find(b => b.sessionId === session.id);
      if (existingBooking) {
        setError('You have already subscribed to this session!');
        handleCloseConfirmDialog();
        return;
      }

      // Server-side duplicate check (in case of stale state or multiple tabs)
      const duplicateCheckQuery = query(
        collection(db, 'attendance'),
        where('sessionId', '==', session.id),
        where('memberId', '==', currentUser.uid)
      );
      const duplicateSnapshot = await getDocs(duplicateCheckQuery);
      if (!duplicateSnapshot.empty) {
        setError('You have already subscribed to this session!');
        handleCloseConfirmDialog();
        await fetchSessions(); // Refresh state
        return;
      }

      if (session.currentAttendance >= session.capacity) {
        setError('This session is full!');
        handleCloseConfirmDialog();
        return;
      }

      const price = getPrice(session);
      const paymentMethod = getPaymentMethod(session);

      // Get member's photo URL
      let memberPhotoUrl = memberData?.photoUrl || '';

      await runTransaction(db, async (transaction) => {
        let invoiceId: string | undefined;

        // Handle payment based on method
        if (paymentMethod === 'balance') {
          // Deduct from member balance
          const memberRef = doc(db, 'members', currentUser.uid);
          const memberDoc = await transaction.get(memberRef);
          const currentBalance = memberDoc.exists() ? memberDoc.data().balance || 0 : 0;
          
          if (currentBalance < price) {
            throw new Error('Insufficient balance');
          }
          
          transaction.update(memberRef, {
            balance: currentBalance - price,
          });

          // Add member transaction record
          const memberTxnRef = doc(collection(db, 'memberTransactions'));
          transaction.set(memberTxnRef, {
            memberId: currentUser.uid,
            type: 'session_payment',
            amount: -price,
            description: `Session on ${format(session.date, 'MMM d, yyyy')} at ${session.locationName}`,
            sessionId: session.id,
            createdAt: Timestamp.now(),
          });

          // Add to club balance
          const clubBalanceRef = doc(db, 'settings', 'clubBalance');
          const clubBalanceDoc = await transaction.get(clubBalanceRef);
          const clubBalance = clubBalanceDoc.exists() ? clubBalanceDoc.data().currentBalance || 0 : 0;
          transaction.set(clubBalanceRef, {
            currentBalance: clubBalance + price,
            lastUpdated: Timestamp.now(),
            updatedBy: 'system',
          }, { merge: true });

          // Add club transaction record
          const clubTxnRef = doc(collection(db, 'clubTransactions'));
          transaction.set(clubTxnRef, {
            type: 'session_payment',
            amount: price,
            description: `Session payment from ${userData.name} (balance)`,
            memberId: currentUser.uid,
            memberName: userData.name,
            sessionId: session.id,
            createdBy: 'system',
            createdByName: 'System',
            createdAt: Timestamp.now(),
          });

        } else if (paymentMethod === 'invoice') {
          // Create invoice for manual payment
          const invoiceRef = doc(collection(db, 'invoices'));
          invoiceId = invoiceRef.id;
          
          transaction.set(invoiceRef, {
            memberId: currentUser.uid,
            memberName: userData.name,
            memberEmail: userData.email,
            amount: price,
            currency: 'EUR',
            status: 'pending',
            uniquePaymentReference: generatePaymentReference(),
            description: `Training session on ${format(session.date, 'MMM d, yyyy')} at ${session.locationName}`,
            sessionId: session.id,
            sessionDate: Timestamp.fromDate(session.date),
            dueDate: Timestamp.fromDate(session.date),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
        }
        // For 'long_term' or 'free', no payment needed

        // Create attendance record
        const attendanceRef = doc(collection(db, 'attendance'));
        transaction.set(attendanceRef, {
          sessionId: session.id,
          memberId: currentUser.uid,
          memberName: userData.name,
          memberPhotoUrl,
          status: 'confirmed',
          paymentMethod,
          amountPaid: price,
          invoiceId: invoiceId || null,
          rsvpAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        // Update session attendance count
        const sessionRef = doc(db, 'sessions', session.id);
        transaction.update(sessionRef, {
          currentAttendance: increment(1),
        });
      });

      // Show success message based on payment method
      if (paymentMethod === 'balance') {
        setSuccess(`Session booked! €${price.toFixed(2)} deducted from your balance.`);
      } else if (paymentMethod === 'long_term') {
        setSuccess('Session booked! (Long-term member - no payment required)');
      } else if (paymentMethod === 'free') {
        setSuccess('Session booked! (Free session)');
      } else {
        setSuccess('Session booked! Please complete payment.');
      }

      handleCloseConfirmDialog();
      await fetchSessions();
      await fetchMemberData(); // Refresh balance
    } catch (error: any) {
      console.error('Error booking session:', error);
      setError(error.message || 'Failed to book session. Please try again.');
    }
  };

  const handleCancelBooking = async (sessionId: string) => {
    if (!currentUser) return;

    if (!window.confirm('Are you sure you want to cancel this booking? The invoice will also be cancelled.')) {
      return;
    }

    try {
      setError('');
      
      const booking = myBookings.find(b => b.sessionId === sessionId);
      if (!booking) return;

      // Delete attendance record
      await deleteDoc(doc(db, 'attendance', booking.attendanceId));

      // Cancel the invoice if exists
      if (booking.invoiceId) {
        await updateDoc(doc(db, 'invoices', booking.invoiceId), {
          status: 'cancelled',
          updatedAt: Timestamp.now(),
        });
      }

      // Update session attendance count
      await updateDoc(doc(db, 'sessions', sessionId), {
        currentAttendance: increment(-1),
      });

      await fetchSessions();
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      setError(error.message || 'Failed to cancel booking. Please try again.');
    }
  };

  const isBooked = (sessionId: string) => {
    return myBookings.some(b => b.sessionId === sessionId);
  };

  const getBookingStatus = (sessionId: string): { label: string; color: 'success' | 'warning' | 'info' | 'default' } => {
    const booking = myBookings.find(b => b.sessionId === sessionId);
    if (!booking) return { label: '', color: 'default' };
    
    // Check payment method first
    if (booking.paymentMethod === 'balance') {
      return { label: 'Paid (Balance)', color: 'success' };
    }
    if (booking.paymentMethod === 'long_term') {
      return { label: 'Long-term Member', color: 'success' };
    }
    if (booking.paymentMethod === 'free') {
      return { label: 'Free Session', color: 'success' };
    }
    
    // For invoice payments
    switch (booking.invoiceStatus) {
      case 'paid':
        return { label: 'Paid', color: 'success' };
      case 'transfer_initiated':
        return { label: 'Awaiting Confirmation', color: 'info' };
      case 'pending':
      default:
        return { label: 'Pending Payment', color: 'warning' };
    }
  };

  const today = startOfDay(new Date());
  const upcomingSessions = sessions.filter(s => s.date >= today);
  const myUpcomingBookings = upcomingSessions.filter(s => isBooked(s.id));

  const sessionTypeColors: Record<string, any> = {
    pool: 'primary',
    open_water: 'info',
    theory: 'secondary',
    competition: 'error',
  };

  const SessionCard = ({ session }: { session: Session }) => {
    const booked = isBooked(session.id);
    const bookingStatus = getBookingStatus(session.id);
    const isFull = session.currentAttendance >= session.capacity;
    const price = getPrice(session);

    return (
      <Card sx={{ height: '100%' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box display="flex" justifyContent="space-between" alignItems="start" mb={1.5} flexWrap="wrap" gap={0.5}>
            <Chip
              label={session.type.replace('_', ' ')}
              color={sessionTypeColors[session.type]}
              size="small"
            />
            {booked && <Chip label={bookingStatus.label} color={bookingStatus.color} size="small" />}
          </Box>
          
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <Event fontSize="small" color="action" />
            <Typography variant="body2" fontWeight="bold" sx={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}>
              {format(session.date, isMobile ? 'EEE, MMM d' : 'EEE, MMM d, yyyy')}
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" mb={0.5} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            ⏰ {session.startTime} - {session.endTime}
          </Typography>
          
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <LocationOn fontSize="small" color="action" />
            <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{session.locationName}</Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <People fontSize="small" color="action" />
            <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              {session.currentAttendance}/{session.capacity} spots
            </Typography>
          </Box>

          {/* Attendees avatars */}
          {sessionAttendees[session.id]?.length > 0 && (
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <AvatarGroup max={isMobile ? 4 : 5} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.7rem' } }}>
                {sessionAttendees[session.id].map((attendee) => (
                  <Tooltip key={attendee.id} title={attendee.memberName}>
                    <Avatar src={attendee.photoUrl || undefined} sx={{ bgcolor: 'primary.main' }}>
                      {!attendee.photoUrl && attendee.memberName.charAt(0).toUpperCase()}
                    </Avatar>
                  </Tooltip>
                ))}
              </AvatarGroup>
            </Box>
          )}
          
          <Box display="flex" alignItems="center" gap={1} mb={1.5}>
            <Euro fontSize="small" color="action" />
            <Typography variant="body2" fontWeight="bold" color="primary">
              €{price.toFixed(2)}
            </Typography>
          </Box>
          
          {session.description && !isMobile && (
            <Typography variant="body2" color="text.secondary" mb={2} sx={{ fontSize: '0.8rem' }}>
              {session.description}
            </Typography>
          )}
          
          {booked ? (
            <Box display="flex" flexDirection="column" gap={1}>
              {bookingStatus.color !== 'success' && (
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size={isMobile ? 'small' : 'medium'}
                  startIcon={<Payment />}
                  onClick={() => navigate(isAdminContext ? '/admin/my-payments' : '/member/payments')}
                >
                  {isMobile ? 'Pay' : 'Go to Payments'}
                </Button>
              )}
              <Button
                fullWidth
                variant="outlined"
                color="error"
                size={isMobile ? 'small' : 'medium'}
                onClick={() => handleCancelBooking(session.id)}
              >
                Cancel
              </Button>
            </Box>
          ) : (
            <Button
              fullWidth
              variant="contained"
              disabled={isFull}
              size={isMobile ? 'small' : 'medium'}
              onClick={() => handleOpenConfirmDialog(session)}
            >
              {isFull ? 'Full' : 'Subscribe'}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ px: { xs: 0, sm: 0 } }}>
      <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
        Book Sessions
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Member Balance Card */}
      {memberData && (memberData.balance || memberData.isLongTermMember) && (
        <Alert 
          severity={memberData.isLongTermMember ? 'success' : 'info'} 
          sx={{ mb: 2 }}
          icon={memberData.isLongTermMember ? undefined : <Euro />}
        >
          {memberData.isLongTermMember && 'You are a long-term member - sessions are free! '}
          {memberData.balance && memberData.balance > 0 && (
            <>Your balance: <strong>€{memberData.balance.toFixed(2)}</strong></>
          )}
        </Alert>
      )}

      {!isMobile && !memberData?.isLongTermMember && !(memberData?.balance && memberData.balance > 0) && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Subscribe to sessions to reserve your spot. An invoice will be created for each booking.
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={(_, v) => setTabValue(v)}
          variant={isMobile ? 'fullWidth' : 'standard'}
        >
          <Tab 
            label={isMobile ? `Available (${upcomingSessions.length})` : `Available Sessions (${upcomingSessions.length})`} 
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          />
          <Tab 
            label={isMobile ? `My Bookings (${myUpcomingBookings.length})` : `My Bookings (${myUpcomingBookings.length})`}
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {upcomingSessions.map(session => (
            <Grid item xs={12} sm={6} md={4} key={session.id}>
              <SessionCard session={session} />
            </Grid>
          ))}
          {upcomingSessions.length === 0 && (
            <Grid item xs={12}>
              <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
                No upcoming sessions available.
              </Typography>
            </Grid>
          )}
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {myUpcomingBookings.map(session => (
            <Grid item xs={12} sm={6} md={4} key={session.id}>
              <SessionCard session={session} />
            </Grid>
          ))}
          {myUpcomingBookings.length === 0 && (
            <Grid item xs={12}>
              <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
                You haven't booked any sessions yet.
              </Typography>
            </Grid>
          )}
        </Grid>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={handleCloseConfirmDialog} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>Confirm Booking</DialogTitle>
        <DialogContent>
          {confirmDialog.session && (
            <Box>
              <Typography variant="body1" gutterBottom>
                You are about to book the following session:
              </Typography>
              <Box bgcolor="background.default" p={2} borderRadius={1} my={2}>
                <Typography variant="body1" fontWeight="bold">
                  {format(confirmDialog.session.date, 'EEEE, MMMM d, yyyy')}
                </Typography>
                <Typography variant="body2">
                  ⏰ {confirmDialog.session.startTime} - {confirmDialog.session.endTime}
                </Typography>
                <Typography variant="body2">
                  📍 {confirmDialog.session.locationName}
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="primary" mt={1}>
                  Price: €{getPrice(confirmDialog.session).toFixed(2)}
                </Typography>
              </Box>
              
              {/* Payment method info */}
              {(() => {
                const paymentMethod = getPaymentMethod(confirmDialog.session);
                if (paymentMethod === 'long_term') {
                  return (
                    <Alert severity="success">
                      As a long-term member, this session is free!
                    </Alert>
                  );
                } else if (paymentMethod === 'free') {
                  return (
                    <Alert severity="success">
                      This is a free session.
                    </Alert>
                  );
                } else if (paymentMethod === 'balance') {
                  return (
                    <Alert severity="info">
                      €{getPrice(confirmDialog.session).toFixed(2)} will be deducted from your balance
                      (Current: €{memberData?.balance?.toFixed(2)}).
                    </Alert>
                  );
                } else {
                  return (
                    <Alert severity="info">
                      An invoice will be created for this booking. You can pay via bank transfer
                      and mark it as paid in your payments page.
                    </Alert>
                  );
                }
              })()}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
          <Button onClick={handleBooking} variant="contained">
            Confirm Booking
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SessionBooking;
