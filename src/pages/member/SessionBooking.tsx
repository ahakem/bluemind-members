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
} from '@mui/material';
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
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Session } from '../../types';
import { format, startOfWeek, addDays, isFuture, isToday } from 'date-fns';

interface BookingInfo {
  sessionId: string;
  attendanceId: string;
}

const SessionBooking: React.FC = () => {
  const { currentUser, userData } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [myBookings, setMyBookings] = useState<BookingInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      console.log('🔍 Fetching sessions for user:', currentUser.uid);
      
      // Fetch all future sessions
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('date', '>=', Timestamp.fromDate(now))
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessionsList = sessionsSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📅 Session data:', doc.id, data);
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate(),
          createdAt: data.createdAt?.toDate(),
        };
      }) as unknown as Session[];

      console.log('✅ Loaded sessions:', sessionsList.length);
      setSessions(sessionsList.sort((a, b) => a.date.getTime() - b.date.getTime()));

      // Fetch my bookings
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('memberId', '==', currentUser.uid)
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const bookings: BookingInfo[] = attendanceSnapshot.docs
        .filter(doc => doc.data().status === 'confirmed')
        .map(doc => {
          console.log('🎫 Booking:', doc.id, doc.data());
          return {
            sessionId: doc.data().sessionId,
            attendanceId: doc.id,
          };
        });
      console.log('✅ My bookings:', bookings);
      setMyBookings(bookings);
    } catch (error: any) {
      console.error('❌ Error fetching sessions:', error);
      setError(error.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (sessionId: string) => {
    if (!currentUser || !userData) return;

    try {
      setError('');
      console.log('📝 Attempting to book session:', sessionId);
      
      const session = sessions.find(s => s.id === sessionId);
      if (!session) {
        setError('Session not found');
        return;
      }

      console.log('📊 Session before booking:', {
        id: session.id,
        currentAttendance: session.currentAttendance,
        capacity: session.capacity
      });

      if (session.currentAttendance >= session.capacity) {
        setError('This session is full!');
        return;
      }

      // Create attendance record
      console.log('➕ Creating attendance record...');
      const attendanceRef = await addDoc(collection(db, 'attendance'), {
        sessionId,
        memberId: currentUser.uid,
        memberName: userData.name,
        status: 'confirmed',
        rsvpAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      console.log('✅ Attendance created:', attendanceRef.id);

      // Update session attendance count
      console.log('🔄 Updating session attendance count...');
      await updateDoc(doc(db, 'sessions', sessionId), {
        currentAttendance: increment(1),
      });
      console.log('✅ Session updated');

      // Refresh data
      console.log('🔄 Refreshing data...');
      await fetchSessions();
      console.log('🎉 Booking complete!');
    } catch (error: any) {
      console.error('❌ Error booking session:', error);
      setError(error.message || 'Failed to book session. Please try again.');
    }
  };

  const handleCancelBooking = async (sessionId: string) => {
    if (!currentUser) return;

    try {
      setError('');
      console.log('❌ Attempting to cancel booking for session:', sessionId);
      
      const booking = myBookings.find(b => b.sessionId === sessionId);
      if (!booking) {
        console.log('⚠️ No booking found for this session');
        return;
      }

      console.log('🗑️ Deleting attendance:', booking.attendanceId);
      // Delete attendance record
      await deleteDoc(doc(db, 'attendance', booking.attendanceId));
      console.log('✅ Attendance deleted');

      // Update session attendance count
      console.log('🔄 Updating session attendance count...');
      await updateDoc(doc(db, 'sessions', sessionId), {
        currentAttendance: increment(-1),
      });
      console.log('✅ Session updated');

      // Refresh data
      console.log('🔄 Refreshing data...');
      await fetchSessions();
      console.log('✅ Cancellation complete!');
    } catch (error: any) {
      console.error('❌ Error cancelling booking:', error);
      setError(error.message || 'Failed to cancel booking. Please try again.');
    }
  };

  const isBooked = (sessionId: string) => {
    return myBookings.some(b => b.sessionId === sessionId);
  };

  const getSessionsByDay = () => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    
    return days.map(day => ({
      date: day,
      sessions: sessions.filter(
        session => format(session.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      ),
    }));
  };

  const sessionTypeColors: Record<string, string> = {
    pool: 'primary',
    open_water: 'info',
    theory: 'secondary',
    competition: 'error',
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
        Book your spot for upcoming sessions. You can cancel your booking anytime before the session starts.
      </Alert>

      <Typography variant="h6" gutterBottom>
        This Week's Schedule
      </Typography>

      <Grid container spacing={2}>
        {getSessionsByDay().map(({ date, sessions: daySessions }) => (
          <Grid item xs={12} md={6} lg={4} key={date.toISOString()}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  {format(date, 'EEEE, MMM d')}
                </Typography>
                {daySessions.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No sessions scheduled
                  </Typography>
                ) : (
                  daySessions.map(session => {
                    const booked = isBooked(session.id);
                    const isFull = session.currentAttendance >= session.capacity;
                    const isPast = session.date < new Date();

                    return (
                      <Box
                        key={session.id}
                        mb={2}
                        p={2}
                        bgcolor="background.default"
                        borderRadius={1}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Chip
                            label={session.type.replace('_', ' ')}
                            color={sessionTypeColors[session.type] as any}
                            size="small"
                          />
                          <Typography variant="body2" fontWeight="bold">
                            {session.startTime} - {session.endTime}
                          </Typography>
                        </Box>
                        <Typography variant="body2" gutterBottom>
                          📍 {session.location}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Capacity: {session.currentAttendance}/{session.capacity}
                        </Typography>
                        {session.description && (
                          <Typography variant="body2" color="text.secondary" mb={1}>
                            {session.description}
                          </Typography>
                        )}
                        
                        {!isPast && (
                          booked ? (
                            <Button
                              fullWidth
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => handleCancelBooking(session.id)}
                            >
                              Cancel Booking
                            </Button>
                          ) : (
                            <Button
                              fullWidth
                              variant="contained"
                              size="small"
                              disabled={isFull}
                              onClick={() => handleBooking(session.id)}
                            >
                              {isFull ? 'Full' : 'Book Now'}
                            </Button>
                          )
                        )}
                        
                        {isPast && (
                          <Chip label="Past Session" size="small" />
                        )}
                      </Box>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SessionBooking;
