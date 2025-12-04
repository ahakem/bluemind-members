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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import { Event, People, LocationOn, Euro } from '@mui/icons-material';
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
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Session, Invoice } from '../../types';
import { format, startOfDay, addDays } from 'date-fns';

interface BookingInfo {
  sessionId: string;
  attendanceId: string;
  invoiceId?: string;
}

const SessionBooking: React.FC = () => {
  const { currentUser, userData } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [myBookings, setMyBookings] = useState<BookingInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; session: Session | null }>({
    open: false,
    session: null,
  });

  useEffect(() => {
    if (currentUser) {
      fetchSessions();
    }
  }, [currentUser]);

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

      // Fetch my bookings
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('memberId', '==', currentUser.uid)
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const bookings: BookingInfo[] = attendanceSnapshot.docs
        .filter(doc => doc.data().status === 'confirmed')
        .map(doc => ({
          sessionId: doc.data().sessionId,
          attendanceId: doc.id,
          invoiceId: doc.data().invoiceId,
        }));
      setMyBookings(bookings);
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
    // Check if user is board member
    const isBoardMember = userData?.role === 'board' || userData?.role === 'admin' || userData?.role === 'super-admin';
    return isBoardMember ? (session.priceBoard || 0) : (session.priceMember || 0);
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

      if (session.currentAttendance >= session.capacity) {
        setError('This session is full!');
        handleCloseConfirmDialog();
        return;
      }

      const price = getPrice(session);

      // Create invoice first
      const invoiceData: Omit<Invoice, 'id'> = {
        memberId: currentUser.uid,
        memberName: userData.name,
        memberEmail: userData.email,
        amount: price,
        currency: 'EUR',
        status: 'pending',
        uniquePaymentReference: generatePaymentReference(),
        description: `Training session on ${format(session.date, 'MMM d, yyyy')} at ${session.locationName}`,
        sessionId: session.id,
        sessionDate: session.date,
        dueDate: session.date, // Due before the session
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const invoiceRef = await addDoc(collection(db, 'invoices'), {
        ...invoiceData,
        dueDate: Timestamp.fromDate(invoiceData.dueDate),
        sessionDate: Timestamp.fromDate(session.date),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Create attendance record with invoice reference
      const attendanceRef = await addDoc(collection(db, 'attendance'), {
        sessionId: session.id,
        memberId: currentUser.uid,
        memberName: userData.name,
        status: 'confirmed',
        invoiceId: invoiceRef.id,
        rsvpAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Update session attendance count
      await updateDoc(doc(db, 'sessions', session.id), {
        currentAttendance: increment(1),
      });

      handleCloseConfirmDialog();
      await fetchSessions();
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
    const isFull = session.currentAttendance >= session.capacity;
    const price = getPrice(session);

    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
            <Chip
              label={session.type.replace('_', ' ')}
              color={sessionTypeColors[session.type]}
              size="small"
            />
            {booked && <Chip label="Booked" color="success" size="small" />}
          </Box>
          
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Event fontSize="small" color="action" />
            <Typography variant="body1" fontWeight="bold">
              {format(session.date, 'EEE, MMM d, yyyy')}
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" mb={1}>
            ⏰ {session.startTime} - {session.endTime}
          </Typography>
          
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <LocationOn fontSize="small" color="action" />
            <Typography variant="body2">{session.locationName}</Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <People fontSize="small" color="action" />
            <Typography variant="body2">
              {session.currentAttendance}/{session.capacity} spots taken
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Euro fontSize="small" color="action" />
            <Typography variant="body2" fontWeight="bold" color="primary">
              €{price.toFixed(2)}
            </Typography>
          </Box>
          
          {session.description && (
            <Typography variant="body2" color="text.secondary" mb={2}>
              {session.description}
            </Typography>
          )}
          
          {booked ? (
            <Button
              fullWidth
              variant="outlined"
              color="error"
              onClick={() => handleCancelBooking(session.id)}
            >
              Cancel Booking
            </Button>
          ) : (
            <Button
              fullWidth
              variant="contained"
              disabled={isFull}
              onClick={() => handleOpenConfirmDialog(session)}
            >
              {isFull ? 'Session Full' : 'Subscribe'}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Book Training Sessions
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 3 }}>
        Subscribe to sessions to reserve your spot. An invoice will be created for each booking.
        You can cancel your booking anytime before the session starts.
      </Alert>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label={`Available Sessions (${upcomingSessions.length})`} />
          <Tab label={`My Bookings (${myUpcomingBookings.length})`} />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Grid container spacing={3}>
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
        <Grid container spacing={3}>
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
      <Dialog open={confirmDialog.open} onClose={handleCloseConfirmDialog} maxWidth="sm" fullWidth>
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
              <Alert severity="info">
                An invoice will be created for this booking. You can pay via bank transfer
                and mark it as paid in your payments page.
              </Alert>
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
