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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import {
  Event,
  CheckCircle,
  Payment as PaymentIcon,
  People,
  AccountBalanceWallet,
  EmojiEvents,
  LocalFireDepartment,
  Star,
  Pool,
  CalendarMonth,
  CalendarToday,
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
import { format, differenceInDays, startOfMonth, startOfYear, endOfMonth, endOfYear } from 'date-fns';

interface Attendee {
  id: string;
  memberName: string;
  photoUrl?: string;
}

interface LeaderboardEntry {
  memberId: string;
  memberName: string;
  photoUrl?: string;
  sessionCount: number;
}

interface AttendanceStats {
  total: number;
  thisMonth: number;
  thisYear: number;
}

const MemberDashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { currentUser } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [nextSession, setNextSession] = useState<Session | null>(null);
  const [nextSessionAttendees, setNextSessionAttendees] = useState<Attendee[]>([]);
  const [pendingInvoice, setPendingInvoice] = useState<Invoice | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({ total: 0, thisMonth: 0, thisYear: 0 });
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [yearlyLeaderboard, setYearlyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myMonthlyRank, setMyMonthlyRank] = useState<number>(0);
  const [myYearlyRank, setMyYearlyRank] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchMemberData();
      fetchAttendanceStats();
      fetchLeaderboards();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const fetchAttendanceStats = async () => {
    if (!currentUser) return;

    try {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const yearStart = startOfYear(now);

      // Fetch all my attendance records
      const myAttendanceQuery = query(
        collection(db, 'attendance'),
        where('memberId', '==', currentUser.uid),
        where('status', 'in', ['confirmed', 'attended'])
      );
      const myAttendanceSnapshot = await getDocs(myAttendanceQuery);
      
      let total = 0;
      let thisMonth = 0;
      let thisYear = 0;

      // Get session dates for each attendance
      for (const attDoc of myAttendanceSnapshot.docs) {
        const attData = attDoc.data();
        total++;
        
        // Get session date
        const sessionDoc = await getDoc(doc(db, 'sessions', attData.sessionId));
        if (sessionDoc.exists()) {
          const sessionDate = sessionDoc.data().date?.toDate();
          if (sessionDate) {
            if (sessionDate >= monthStart) thisMonth++;
            if (sessionDate >= yearStart) thisYear++;
          }
        }
      }

      setAttendanceStats({ total, thisMonth, thisYear });
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
    }
  };

  const fetchLeaderboards = async () => {
    if (!currentUser) return;

    try {
      const now = new Date();
      const monthStart = Timestamp.fromDate(startOfMonth(now));
      const monthEnd = Timestamp.fromDate(endOfMonth(now));
      const yearStart = Timestamp.fromDate(startOfYear(now));
      const yearEnd = Timestamp.fromDate(endOfYear(now));

      // Get all sessions this month
      const monthlySessionsQuery = query(
        collection(db, 'sessions'),
        where('date', '>=', monthStart),
        where('date', '<=', monthEnd)
      );
      const monthlySessionsSnapshot = await getDocs(monthlySessionsQuery);
      const monthlySessionIds = monthlySessionsSnapshot.docs.map(d => d.id);

      // Get all sessions this year
      const yearlySessionsQuery = query(
        collection(db, 'sessions'),
        where('date', '>=', yearStart),
        where('date', '<=', yearEnd)
      );
      const yearlySessionsSnapshot = await getDocs(yearlySessionsQuery);
      const yearlySessionIds = yearlySessionsSnapshot.docs.map(d => d.id);

      // Get all attendance records
      const attendanceSnapshot = await getDocs(collection(db, 'attendance'));
      
      const monthlyCount: Record<string, { name: string; photoUrl?: string; count: number }> = {};
      const yearlyCount: Record<string, { name: string; photoUrl?: string; count: number }> = {};

      for (const attDoc of attendanceSnapshot.docs) {
        const data = attDoc.data();
        if (data.status !== 'confirmed' && data.status !== 'attended') continue;

        const memberId = data.memberId;
        const memberName = data.memberName;
        const photoUrl = data.memberPhotoUrl;

        // Monthly
        if (monthlySessionIds.includes(data.sessionId)) {
          if (!monthlyCount[memberId]) {
            monthlyCount[memberId] = { name: memberName, photoUrl, count: 0 };
          }
          monthlyCount[memberId].count++;
        }

        // Yearly
        if (yearlySessionIds.includes(data.sessionId)) {
          if (!yearlyCount[memberId]) {
            yearlyCount[memberId] = { name: memberName, photoUrl, count: 0 };
          }
          yearlyCount[memberId].count++;
        }
      }

      // Sort and get top 5
      const monthlyLeaders = Object.entries(monthlyCount)
        .map(([id, data]) => ({ memberId: id, memberName: data.name, photoUrl: data.photoUrl, sessionCount: data.count }))
        .sort((a, b) => b.sessionCount - a.sessionCount)
        .slice(0, 5);

      const yearlyLeaders = Object.entries(yearlyCount)
        .map(([id, data]) => ({ memberId: id, memberName: data.name, photoUrl: data.photoUrl, sessionCount: data.count }))
        .sort((a, b) => b.sessionCount - a.sessionCount)
        .slice(0, 5);

      setMonthlyLeaderboard(monthlyLeaders);
      setYearlyLeaderboard(yearlyLeaders);

      // Find my rank
      const allMonthlyRanked = Object.entries(monthlyCount)
        .sort((a, b) => b[1].count - a[1].count);
      const myMonthlyIdx = allMonthlyRanked.findIndex(([id]) => id === currentUser.uid);
      setMyMonthlyRank(myMonthlyIdx >= 0 ? myMonthlyIdx + 1 : 0);

      const allYearlyRanked = Object.entries(yearlyCount)
        .sort((a, b) => b[1].count - a[1].count);
      const myYearlyIdx = allYearlyRanked.findIndex(([id]) => id === currentUser.uid);
      setMyYearlyRank(myYearlyIdx >= 0 ? myYearlyIdx + 1 : 0);

    } catch (error) {
      console.error('Error fetching leaderboards:', error);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: '🥇', color: '#FFD700' };
    if (rank === 2) return { icon: '🥈', color: '#C0C0C0' };
    if (rank === 3) return { icon: '🥉', color: '#CD7F32' };
    return { icon: `#${rank}`, color: theme.palette.text.secondary };
  };

  const getAchievementBadges = () => {
    const badges = [];
    
    if (attendanceStats.total >= 1) badges.push({ icon: '🏊', label: 'First Dive', desc: 'Attended your first session' });
    if (attendanceStats.total >= 10) badges.push({ icon: '🐬', label: 'Dolphin', desc: '10 sessions attended' });
    if (attendanceStats.total >= 25) badges.push({ icon: '🦈', label: 'Shark', desc: '25 sessions attended' });
    if (attendanceStats.total >= 50) badges.push({ icon: '🐋', label: 'Whale', desc: '50 sessions attended' });
    if (attendanceStats.total >= 100) badges.push({ icon: '🔱', label: 'Poseidon', desc: '100 sessions attended' });
    
    if (attendanceStats.thisMonth >= 4) badges.push({ icon: '🔥', label: 'On Fire', desc: '4+ sessions this month' });
    if (attendanceStats.thisMonth >= 8) badges.push({ icon: '⚡', label: 'Unstoppable', desc: '8+ sessions this month' });
    
    if (myMonthlyRank === 1) badges.push({ icon: '👑', label: 'Monthly Champion', desc: '#1 this month' });
    if (myYearlyRank === 1) badges.push({ icon: '🏆', label: 'Year Champion', desc: '#1 this year' });
    
    return badges;
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
      {/* Header */}
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
        <Box>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            Welcome, {member?.name?.split(' ')[0]}!
          </Typography>
          {myMonthlyRank > 0 && (
            <Typography variant="body2" color="text.secondary">
              Ranked #{myMonthlyRank} this month • #{myYearlyRank} this year
            </Typography>
          )}
        </Box>
      </Box>

      {pendingInvoice && (
        <Alert severity="warning" sx={{ mb: 2, fontSize: { xs: '0.8rem', sm: '0.875rem' } }} icon={<PaymentIcon />}>
          You have a pending payment of €{pendingInvoice.amount?.toFixed(2)}.
        </Alert>
      )}

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Balance & Stats Row */}
        <Grid item xs={6} sm={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <AccountBalanceWallet sx={{ color: 'white', mb: 1 }} />
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                €{(member?.balance || 0).toFixed(2)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Balance
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Pool sx={{ color: 'white', mb: 1 }} />
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                {attendanceStats.total}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Total Sessions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <CalendarMonth sx={{ color: 'white', mb: 1 }} />
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                {attendanceStats.thisMonth}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                This Month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <CalendarToday sx={{ color: 'white', mb: 1 }} />
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                {attendanceStats.thisYear}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                This Year
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Achievements */}
        {getAchievementBadges().length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <EmojiEvents sx={{ color: '#FFD700', mr: 1 }} />
                  <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    Your Achievements
                  </Typography>
                </Box>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {getAchievementBadges().map((badge, idx) => (
                    <Tooltip key={idx} title={badge.desc}>
                      <Chip
                        icon={<span style={{ fontSize: '1.2rem' }}>{badge.icon}</span>}
                        label={badge.label}
                        variant="outlined"
                        sx={{ 
                          borderColor: 'primary.main',
                          '& .MuiChip-icon': { ml: 1 }
                        }}
                      />
                    </Tooltip>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Leaderboards */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box display="flex" alignItems="center" mb={2}>
                <LocalFireDepartment sx={{ color: '#FF6B6B', mr: 1 }} />
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  🏆 Participant of the Month
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                {format(new Date(), 'MMMM yyyy')}
              </Typography>
              <List dense disablePadding>
                {monthlyLeaderboard.map((entry, idx) => {
                  const badge = getRankBadge(idx + 1);
                  const isMe = entry.memberId === currentUser?.uid;
                  return (
                    <ListItem 
                      key={entry.memberId} 
                      sx={{ 
                        px: 1, 
                        py: 0.5,
                        bgcolor: isMe ? 'action.selected' : 'transparent',
                        borderRadius: 1,
                      }}
                    >
                      <Typography sx={{ width: 30, fontWeight: 'bold', color: badge.color }}>
                        {badge.icon}
                      </Typography>
                      <ListItemAvatar sx={{ minWidth: 40 }}>
                        <Avatar src={entry.photoUrl} sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          {entry.memberName.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={entry.memberName.split(' ')[0]}
                        secondary={`${entry.sessionCount} sessions`}
                        primaryTypographyProps={{ 
                          fontWeight: isMe ? 'bold' : 'normal',
                          fontSize: '0.9rem'
                        }}
                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                      />
                    </ListItem>
                  );
                })}
                {monthlyLeaderboard.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No sessions this month yet. Be the first!
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Star sx={{ color: '#FFD700', mr: 1 }} />
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  🌟 Participant of the Year
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                {format(new Date(), 'yyyy')}
              </Typography>
              <List dense disablePadding>
                {yearlyLeaderboard.map((entry, idx) => {
                  const badge = getRankBadge(idx + 1);
                  const isMe = entry.memberId === currentUser?.uid;
                  return (
                    <ListItem 
                      key={entry.memberId}
                      sx={{ 
                        px: 1, 
                        py: 0.5,
                        bgcolor: isMe ? 'action.selected' : 'transparent',
                        borderRadius: 1,
                      }}
                    >
                      <Typography sx={{ width: 30, fontWeight: 'bold', color: badge.color }}>
                        {badge.icon}
                      </Typography>
                      <ListItemAvatar sx={{ minWidth: 40 }}>
                        <Avatar src={entry.photoUrl} sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          {entry.memberName.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={entry.memberName.split(' ')[0]}
                        secondary={`${entry.sessionCount} sessions`}
                        primaryTypographyProps={{ 
                          fontWeight: isMe ? 'bold' : 'normal',
                          fontSize: '0.9rem'
                        }}
                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                      />
                    </ListItem>
                  );
                })}
                {yearlyLeaderboard.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No sessions this year yet. Start training!
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Membership Status */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
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
              {member?.isLongTermMember && (
                <Chip 
                  label="Long-term Member" 
                  color="info" 
                  size="small" 
                  sx={{ mt: 1 }}
                  icon={<Star fontSize="small" />}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Next Session */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
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
                        {nextSessionAttendees.length} attending
                      </Typography>
                    </Box>
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
