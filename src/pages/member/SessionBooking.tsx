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
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Event, People, LocationOn, Euro, Payment, CardMembership, Warning, CalendarMonth, Apple, Google } from '@mui/icons-material';
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
import { Session, Invoice, Member, TrialSettings, PoolLocation } from '../../types';
import { format, startOfDay } from 'date-fns';

interface BookingInfo {
  sessionId: string;
  attendanceId: string;
  invoiceId?: string;
  invoiceStatus?: string;
  paymentMethod?: string;
  amountPaid?: number;
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
  const [trialSettings, setTrialSettings] = useState<TrialSettings | null>(null);
  const [membershipDialogOpen, setMembershipDialogOpen] = useState(false);
  const [, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; session: Session | null }>({
    open: false,
    session: null,
  });
  const [calendarDialog, setCalendarDialog] = useState<{ open: boolean; session: Session | null }>({
    open: false,
    session: null,
  });
  const [locations, setLocations] = useState<Record<string, PoolLocation>>({});

  // Determine if we're in admin context
  const isAdminContext = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (currentUser) {
      fetchSessions();
      fetchMemberData();
      fetchTrialSettings();
      fetchLocations();
    }
  }, [currentUser]);

  const fetchTrialSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'trialSettings'));
      if (settingsDoc.exists()) {
        setTrialSettings(settingsDoc.data() as TrialSettings);
      } else {
        // Default settings
        setTrialSettings({
          maxTrialSessions: 3,
          trialSessionPrice: 10,
          membershipFee: 25,
          cancellationDeadlineDays: 60,
        });
      }
    } catch (e) {
      console.error('Error fetching trial settings:', e);
    }
  };

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

  const fetchLocations = async () => {
    try {
      const locationsSnapshot = await getDocs(collection(db, 'locations'));
      const locationsMap: Record<string, PoolLocation> = {};
      locationsSnapshot.docs.forEach(doc => {
        locationsMap[doc.id] = { id: doc.id, ...doc.data() } as PoolLocation;
      });
      setLocations(locationsMap);
    } catch (e) {
      console.error('Error fetching locations:', e);
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
              amountPaid: data.amountPaid || 0,
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

  // Check if user is a non-member (approved but not active member)
  const isNonMember = (): boolean => {
    return memberData?.membershipStatus !== 'active';
  };

  // Check how many trial sessions the user has used
  const getTrialSessionsUsed = (): number => {
    return memberData?.trialSessionsUsed || 0;
  };

  // Check if user can still do trial sessions
  const canDoTrialSession = (): boolean => {
    if (!isNonMember()) return false; // Active members don't need trials
    if (!trialSettings) return false;
    return getTrialSessionsUsed() < trialSettings.maxTrialSessions;
  };

  // Get remaining trial sessions
  const getRemainingTrialSessions = (): number => {
    if (!trialSettings) return 0;
    return Math.max(0, trialSettings.maxTrialSessions - getTrialSessionsUsed());
  };

  // Calendar helper functions
  const formatDateForCalendar = (date: Date, time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  // Get location address from locationId
  const getLocationAddress = (session: Session): string => {
    const loc = locations[session.locationId];
    return loc?.address || session.locationName || '';
  };

  const generateGoogleCalendarUrl = (session: Session): string => {
    const startDateTime = formatDateForCalendar(session.date, session.startTime);
    const endDateTime = formatDateForCalendar(session.date, session.endTime);
    const title = encodeURIComponent(`Blue Mind Freediving - ${session.type.replace('_', ' ')}`);
    const location = encodeURIComponent(getLocationAddress(session));
    const details = encodeURIComponent(session.description || `Freediving ${session.type.replace('_', ' ')} session at ${session.locationName}`);
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateTime}/${endDateTime}&location=${location}&details=${details}`;
  };

  const generateICSContent = (session: Session): string => {
    const startDateTime = formatDateForCalendar(session.date, session.startTime);
    const endDateTime = formatDateForCalendar(session.date, session.endTime);
    const title = `Blue Mind Freediving - ${session.type.replace('_', ' ')}`;
    const location = getLocationAddress(session);
    const description = session.description || `Freediving ${session.type.replace('_', ' ')} session at ${session.locationName}`;
    
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Blue Mind Freediving//Session//EN
BEGIN:VEVENT
DTSTART:${startDateTime}
DTEND:${endDateTime}
SUMMARY:${title}
LOCATION:${location}
DESCRIPTION:${description}
END:VEVENT
END:VCALENDAR`;
  };

  const downloadICSFile = (session: Session) => {
    const icsContent = generateICSContent(session);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bluemind-session-${format(session.date, 'yyyy-MM-dd')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateOutlookUrl = (session: Session): string => {
    const startDateTime = formatDateForCalendar(session.date, session.startTime);
    const endDateTime = formatDateForCalendar(session.date, session.endTime);
    const title = encodeURIComponent(`Blue Mind Freediving - ${session.type.replace('_', ' ')}`);
    const location = encodeURIComponent(getLocationAddress(session));
    const details = encodeURIComponent(session.description || `Freediving ${session.type.replace('_', ' ')} session at ${session.locationName}`);
    
    return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${startDateTime}&enddt=${endDateTime}&location=${location}&body=${details}`;
  };

  // Check if member qualifies for free session based on long-term groups  // Check if member qualifies for free session based on long-term groups
  const memberQualifiesForFreeSession = (session: Session): boolean => {
    // Must be a long-term member
    if (!memberData?.isLongTermMember) {
      return false;
    }
    
    const memberGroups = memberData.longTermGroups || [];
    const sessionAllowedGroups = session.allowedLongTermGroups || [];
    
    // If member has 'unlimited' group, they can join any session
    if (memberGroups.includes('unlimited')) {
      return true;
    }
    
    // If session has no group restrictions, long-term members with isLongTermMember flag get in free
    // (backward compatibility for sessions without allowedLongTermGroups)
    if (sessionAllowedGroups.length === 0) {
      return true;
    }
    
    // Check if member has any group that matches the session's allowed groups
    return memberGroups.some(group => sessionAllowedGroups.includes(group));
  };

  const getPrice = (session: Session) => {
    // Non-members pay trial price
    if (isNonMember()) {
      return trialSettings?.trialSessionPrice || 10;
    }
    // Long-term members who qualify for this session get free access
    if (memberQualifiesForFreeSession(session)) {
      return 0;
    }
    // Check if user is board member (separate flag, not a role)
    const isBoardMember = userData?.isBoardMember || false;
    return isBoardMember ? (session.priceBoard || 0) : (session.priceMember || 0);
  };

  const getPaymentMethod = (session: Session): 'long_term' | 'balance' | 'invoice' | 'free' | 'trial' => {
    const price = getPrice(session);
    
    // Free session (only for active members with long-term status)
    if (price === 0 && !isNonMember()) {
      return memberQualifiesForFreeSession(session) ? 'long_term' : 'free';
    }
    
    // Has enough balance - pay from balance (works for both members and non-members)
    if (memberData?.balance && memberData.balance >= price) {
      return 'balance';
    }
    
    // Non-members without enough balance get trial invoice
    if (isNonMember()) {
      return 'trial';
    }
    
    // Active members without enough balance get regular invoice
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

      // Check if non-member has exceeded trial sessions
      if (isNonMember() && !canDoTrialSession()) {
        setError(`You have used all ${trialSettings?.maxTrialSessions || 3} trial sessions. Please complete your membership to continue booking.`);
        handleCloseConfirmDialog();
        setMembershipDialogOpen(true);
        return;
      }

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
        // ============ ALL READS FIRST ============
        let currentMemberBalance = 0;
        let clubBalance = 0;
        
        const memberRef = doc(db, 'members', currentUser.uid);
        const clubBalanceRef = doc(db, 'settings', 'clubBalance');
        const sessionRef = doc(db, 'sessions', session.id);

        if (paymentMethod === 'balance') {
          const memberDoc = await transaction.get(memberRef);
          currentMemberBalance = memberDoc.exists() ? memberDoc.data().balance || 0 : 0;
          
          if (currentMemberBalance < price) {
            throw new Error('Insufficient balance');
          }

          const clubBalanceDoc = await transaction.get(clubBalanceRef);
          clubBalance = clubBalanceDoc.exists() ? clubBalanceDoc.data().currentBalance || 0 : 0;
        }

        // ============ ALL WRITES AFTER ============
        let invoiceId: string | undefined;

        // Handle payment based on method
        if (paymentMethod === 'balance') {
          // Deduct from member balance
          // If non-member, also increment trial sessions used
          if (isNonMember()) {
            transaction.update(memberRef, {
              balance: currentMemberBalance - price,
              trialSessionsUsed: (memberData?.trialSessionsUsed || 0) + 1,
            });
          } else {
            transaction.update(memberRef, {
              balance: currentMemberBalance - price,
            });
          }

          // Add member transaction record
          const memberTxnRef = doc(collection(db, 'memberTransactions'));
          transaction.set(memberTxnRef, {
            memberId: currentUser.uid,
            type: 'session_payment',
            amount: -price,
            description: `${isNonMember() ? 'Trial session' : 'Session'} on ${format(session.date, 'MMM d, yyyy')} at ${session.locationName}`,
            sessionId: session.id,
            createdAt: Timestamp.now(),
          });

          // Add to club balance
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
            type: 'session',
            status: 'pending',
            uniquePaymentReference: generatePaymentReference(),
            description: `Training session on ${format(session.date, 'MMM d, yyyy')} at ${session.locationName}`,
            sessionId: session.id,
            sessionDate: Timestamp.fromDate(session.date),
            dueDate: Timestamp.fromDate(session.date),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
        } else if (paymentMethod === 'trial') {
          // Create trial session invoice
          const invoiceRef = doc(collection(db, 'invoices'));
          invoiceId = invoiceRef.id;
          
          transaction.set(invoiceRef, {
            memberId: currentUser.uid,
            memberName: userData.name,
            memberEmail: userData.email,
            amount: price,
            currency: 'EUR',
            type: 'trial_session',
            status: 'pending',
            uniquePaymentReference: generatePaymentReference(),
            description: `Trial session on ${format(session.date, 'MMM d, yyyy')} at ${session.locationName}`,
            sessionId: session.id,
            sessionDate: Timestamp.fromDate(session.date),
            dueDate: Timestamp.fromDate(session.date),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });

          // Increment trial sessions used
          transaction.update(memberRef, {
            trialSessionsUsed: (memberData?.trialSessionsUsed || 0) + 1,
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
        transaction.update(sessionRef, {
          currentAttendance: increment(1),
        });
      });

      // Show success message based on payment method
      if (paymentMethod === 'balance') {
        if (isNonMember()) {
          const remaining = getRemainingTrialSessions() - 1;
          setSuccess(`Trial session booked! €${price.toFixed(2)} deducted from your balance. You have ${remaining} trial session(s) remaining.`);
        } else {
          setSuccess(`Session booked! €${price.toFixed(2)} deducted from your balance.`);
        }
      } else if (paymentMethod === 'long_term') {
        setSuccess('Session booked! (Long-term member - no payment required)');
      } else if (paymentMethod === 'free') {
        setSuccess('Session booked! (Free session)');
      } else if (paymentMethod === 'trial') {
        const remaining = getRemainingTrialSessions() - 1;
        setSuccess(`Trial session booked! €${price.toFixed(2)} - Please complete payment. You have ${remaining} trial session(s) remaining.`);
      } else {
        setSuccess('Session booked! Please complete payment.');
      }

      // Show calendar dialog
      setCalendarDialog({ open: true, session });
      
      handleCloseConfirmDialog();
      await fetchSessions();
      await fetchMemberData(); // Refresh balance
    } catch (error: any) {
      console.error('Error booking session:', error);
      setError(error.message || 'Failed to book session. Please try again.');
    }
  };

  const handleCancelBooking = async (sessionId: string) => {
    if (!currentUser || !userData || !memberData) return;

    const booking = myBookings.find(b => b.sessionId === sessionId);
    if (!booking) return;

    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    // Check if eligible for refund based on cancellation deadline
    const sessionDateTime = session.date instanceof Date ? session.date : new Date(session.date);
    const now = new Date();
    const daysUntilSession = (sessionDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    const deadlineDays = trialSettings?.cancellationDeadlineDays || 60;
    const isWithinRefundDeadline = daysUntilSession >= deadlineDays;
    const canGetRefund = isWithinRefundDeadline && booking.paymentMethod === 'balance' && (booking.amountPaid || 0) > 0;

    let confirmMessage = 'Are you sure you want to cancel this booking?';
    
    if (canGetRefund) {
      confirmMessage = `Cancel this booking? You will receive a refund of €${(booking.amountPaid || 0).toFixed(2)} to your balance.`;
    } else if (booking.paymentMethod === 'balance' && (booking.amountPaid || 0) > 0 && !isWithinRefundDeadline) {
      confirmMessage = `Warning: You are cancelling less than ${deadlineDays} days before the session. You will NOT receive a refund. Are you sure?`;
    } else if (booking.invoiceId) {
      confirmMessage = 'Are you sure you want to cancel this booking? The invoice will also be cancelled.';
    }

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setError('');

      // If paid from balance and within deadline, refund to balance
      if (canGetRefund) {
        const memberRef = doc(db, 'members', currentUser.uid);
        const clubBalanceRef = doc(db, 'settings', 'clubBalance');
        
        // Update member balance (add refund)
        await updateDoc(memberRef, {
          balance: (memberData.balance || 0) + (booking.amountPaid || 0),
        });
        
        // Deduct from club balance
        const clubBalanceDoc = await getDoc(clubBalanceRef);
        const currentClubBalance = clubBalanceDoc.exists() ? clubBalanceDoc.data().currentBalance || 0 : 0;
        await updateDoc(clubBalanceRef, {
          currentBalance: currentClubBalance - (booking.amountPaid || 0),
          lastUpdated: Timestamp.now(),
          updatedBy: 'system',
        });
        
        // Create a balance transaction record for the refund
        await addDoc(collection(db, 'balanceTransactions'), {
          memberId: currentUser.uid,
          memberName: userData.name,
          amount: booking.amountPaid || 0,
          type: 'refund',
          description: `Refund for cancelled session on ${format(sessionDateTime, 'MMM d, yyyy')}`,
          createdBy: currentUser.uid,
          createdByName: userData.name,
          createdAt: Timestamp.now(),
        });
        
        // Create club transaction record for the refund
        await addDoc(collection(db, 'clubTransactions'), {
          type: 'session_refund',
          amount: -(booking.amountPaid || 0),
          description: `Session refund to ${userData.name}`,
          memberId: currentUser.uid,
          memberName: userData.name,
          createdBy: 'system',
          createdByName: 'System',
          createdAt: Timestamp.now(),
        });
      }

      // If it was a trial session, decrement the trial count to allow re-booking
      if (booking.paymentMethod === 'trial' || (isNonMember() && booking.paymentMethod === 'balance')) {
        const memberRef = doc(db, 'members', currentUser.uid);
        const currentTrials = memberData.trialSessionsUsed || 0;
        if (currentTrials > 0) {
          await updateDoc(memberRef, {
            trialSessionsUsed: currentTrials - 1,
          });
        }
      }

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

      if (canGetRefund) {
        setSuccess(`Booking cancelled. €${(booking.amountPaid || 0).toFixed(2)} has been refunded to your balance.`);
      } else {
        setSuccess('Booking cancelled successfully.');
      }

      await fetchSessions();
      await fetchMemberData(); // Refresh balance
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      setError(error.message || 'Failed to cancel booking. Please try again.');
    }
  };

  const handleCompleteMembership = async () => {
    if (!currentUser || !userData || !trialSettings) return;

    try {
      setError('');
      const membershipFee = trialSettings.membershipFee;
      const currentBalance = memberData?.balance || 0;
      
      // Check if member has enough balance to pay directly
      if (currentBalance >= membershipFee) {
        // Pay from balance using transaction
        await runTransaction(db, async (transaction) => {
          const memberRef = doc(db, 'members', currentUser.uid);
          const clubBalanceRef = doc(db, 'settings', 'clubBalance');
          
          // Read current club balance
          const clubBalanceDoc = await transaction.get(clubBalanceRef);
          const clubBalance = clubBalanceDoc.exists() ? clubBalanceDoc.data().currentBalance || 0 : 0;
          
          // Deduct from member balance
          transaction.update(memberRef, {
            balance: currentBalance - membershipFee,
            membershipStatus: 'active',
            updatedAt: Timestamp.now(),
          });
          
          // Add to club balance
          transaction.set(clubBalanceRef, {
            currentBalance: clubBalance + membershipFee,
            lastUpdated: Timestamp.now(),
            updatedBy: currentUser.uid,
          }, { merge: true });
          
          // Create member transaction record
          const memberTxnRef = doc(collection(db, 'memberTransactions'));
          transaction.set(memberTxnRef, {
            memberId: currentUser.uid,
            type: 'session_payment',
            amount: -membershipFee,
            description: 'Yearly Membership Fee (paid from balance)',
            createdAt: Timestamp.now(),
          });
          
          // Create club transaction record
          const clubTxnRef = doc(collection(db, 'clubTransactions'));
          transaction.set(clubTxnRef, {
            type: 'session_payment',
            amount: membershipFee,
            description: `Membership fee from ${userData.name} (balance)`,
            memberId: currentUser.uid,
            memberName: userData.name,
            createdBy: 'system',
            createdByName: 'System',
            createdAt: Timestamp.now(),
          });
        });
        
        setSuccess(`Membership activated! €${membershipFee.toFixed(2)} deducted from your balance.`);
        setMembershipDialogOpen(false);
        await fetchMemberData(); // Refresh balance
      } else {
        // Create membership invoice for bank transfer
        await addDoc(collection(db, 'invoices'), {
          memberId: currentUser.uid,
          memberName: userData.name,
          memberEmail: userData.email,
          amount: membershipFee,
          currency: 'EUR',
          type: 'membership',
          status: 'pending',
          uniquePaymentReference: generatePaymentReference(),
          description: 'Blue Mind Freediving - Yearly Membership Fee',
          dueDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days from now
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        setSuccess(`Membership invoice created for €${membershipFee.toFixed(2)}. Please complete payment to activate your membership.`);
        setMembershipDialogOpen(false);
        
        // Navigate to payments page
        const paymentsPath = isAdminContext ? '/admin/my-payments' : '/member/payments';
        navigate(paymentsPath);
      }
    } catch (error: any) {
      console.error('Error creating membership invoice:', error);
      setError(error.message || 'Failed to create membership invoice. Please try again.');
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
    if (booking.paymentMethod === 'trial') {
      switch (booking.invoiceStatus) {
        case 'paid':
          return { label: 'Trial - Paid', color: 'success' };
        case 'transfer_initiated':
          return { label: 'Trial - Awaiting Confirmation', color: 'info' };
        default:
          return { label: 'Trial - Pending Payment', color: 'warning' };
      }
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
                color="info"
                size={isMobile ? 'small' : 'medium'}
                startIcon={<CalendarMonth />}
                onClick={() => setCalendarDialog({ open: true, session })}
              >
                {isMobile ? 'Calendar' : 'Add to Calendar'}
              </Button>
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

      {/* Non-member Trial Status Banner */}
      {isNonMember() && trialSettings && (
        <Paper 
          sx={{ 
            p: 2, 
            mb: 2, 
            bgcolor: canDoTrialSession() ? 'info.light' : 'warning.light',
            color: canDoTrialSession() ? 'info.contrastText' : 'warning.contrastText',
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <Warning />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {canDoTrialSession() 
                    ? `Trial Member - ${getRemainingTrialSessions()} trial session(s) remaining`
                    : 'All trial sessions used'}
                </Typography>
                <Typography variant="body2">
                  {canDoTrialSession()
                    ? `Trial price: €${trialSettings.trialSessionPrice.toFixed(2)} per session. Become a member for cheaper sessions!`
                    : 'Complete your membership to continue booking sessions at member prices'}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              color={canDoTrialSession() ? 'primary' : 'warning'}
              startIcon={<CardMembership />}
              onClick={() => setMembershipDialogOpen(true)}
              size={isMobile ? 'small' : 'medium'}
            >
              {isMobile ? 'Join Now' : 'Complete Membership'}
            </Button>
          </Box>
        </Paper>
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
                  if (isNonMember()) {
                    return (
                      <Alert severity="info">
                        <strong>Trial Session (from balance)</strong><br/>
                        €{getPrice(confirmDialog.session).toFixed(2)} will be deducted from your balance
                        (Current: €{memberData?.balance?.toFixed(2)}).<br/>
                        Remaining trials after this: {getRemainingTrialSessions() - 1}
                      </Alert>
                    );
                  }
                  return (
                    <Alert severity="info">
                      €{getPrice(confirmDialog.session).toFixed(2)} will be deducted from your balance
                      (Current: €{memberData?.balance?.toFixed(2)}).
                    </Alert>
                  );
                } else if (paymentMethod === 'trial') {
                  return (
                    <Alert severity="warning">
                      <strong>Trial Session</strong><br/>
                      Price: €{getPrice(confirmDialog.session).toFixed(2)}<br/>
                      Remaining trials after this: {getRemainingTrialSessions() - 1}<br/>
                      An invoice will be created. Become a member for cheaper session prices!
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

      {/* Membership Completion Dialog */}
      <Dialog 
        open={membershipDialogOpen} 
        onClose={() => setMembershipDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CardMembership color="primary" />
          Complete Your Membership
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Become a full member to enjoy:
              <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                <li>Access to all training sessions</li>
                <li><strong>Cheaper sessions!</strong> Member price: €{(sessions[0]?.priceMember || 7).toFixed(2)} vs trial price: €{trialSettings?.trialSessionPrice.toFixed(2)}</li>
                <li>No trial session limits</li>
                <li>Full club benefits for one year</li>
              </ul>
            </Alert>

            <Paper sx={{ p: 2, bgcolor: 'background.default', textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                Yearly Membership Fee
              </Typography>
              <Typography variant="h3" color="primary" fontWeight="bold">
                €{trialSettings?.membershipFee.toFixed(2) || '25.00'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                per year
              </Typography>
            </Paper>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              After payment confirmation by an admin, your membership will be activated for one year
              and you can book sessions at the cheaper member prices.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMembershipDialogOpen(false)}>
            Maybe Later
          </Button>
          <Button 
            onClick={handleCompleteMembership} 
            variant="contained" 
            color="primary"
            startIcon={<CardMembership />}
          >
            Create Membership Invoice
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add to Calendar Dialog */}
      <Dialog 
        open={calendarDialog.open} 
        onClose={() => setCalendarDialog({ open: false, session: null })} 
        maxWidth="xs" 
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarMonth color="primary" />
          Add to Calendar
        </DialogTitle>
        <DialogContent>
          {calendarDialog.session && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Add this session to your calendar:
              </Typography>
              <Card variant="outlined" sx={{ mt: 2, mb: 2 }}>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
                    {calendarDialog.session.type.replace('_', ' ')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    📍 {calendarDialog.session.locationName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', ml: 2.5 }}>
                    {getLocationAddress(calendarDialog.session)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    📅 {format(new Date(calendarDialog.session.date instanceof Date ? calendarDialog.session.date : calendarDialog.session.date), 'EEEE, MMMM d, yyyy')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    🕐 {calendarDialog.session.startTime} - {calendarDialog.session.endTime}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                if (calendarDialog.session) {
                  window.open(generateGoogleCalendarUrl(calendarDialog.session), '_blank');
                }
              }}
              sx={{ 
                justifyContent: 'flex-start', 
                textTransform: 'none',
                py: 1.5
              }}
            >
              <Box component="img" src="https://www.google.com/calendar/images/favicon_v2014_1.ico" sx={{ width: 20, height: 20, mr: 2 }} />
              Add to Google Calendar
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                if (calendarDialog.session) {
                  downloadICSFile(calendarDialog.session);
                }
              }}
              sx={{ 
                justifyContent: 'flex-start', 
                textTransform: 'none',
                py: 1.5
              }}
            >
              <Box component="span" sx={{ width: 20, height: 20, mr: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                📅
              </Box>
              Download for Apple Calendar / Other
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                if (calendarDialog.session) {
                  window.open(generateOutlookUrl(calendarDialog.session), '_blank');
                }
              }}
              sx={{ 
                justifyContent: 'flex-start', 
                textTransform: 'none',
                py: 1.5
              }}
            >
              <Box component="img" src="https://outlook.live.com/favicon.ico" sx={{ width: 20, height: 20, mr: 2 }} />
              Add to Outlook Calendar
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCalendarDialog({ open: false, session: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SessionBooking;
