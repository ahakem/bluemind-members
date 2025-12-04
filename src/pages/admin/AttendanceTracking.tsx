import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Button,
  Alert,
  Avatar,
} from '@mui/material';
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Session, Member, Attendance } from '../../types';
import { format } from 'date-fns';

const AttendanceTracking: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [existingAttendance, setExistingAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSessions();
    fetchMembers();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchAttendance(selectedSession);
    }
  }, [selectedSession]);

  const fetchSessions = async () => {
    try {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('date', '>=', Timestamp.fromDate(now))
      );
      const querySnapshot = await getDocs(sessionsQuery);
      const sessionsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
      })) as Session[];
      setSessions(sessionsList.sort((a, b) => a.date.getTime() - b.date.getTime()));
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'members'));
      const membersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as unknown as Member[];
      setMembers(membersList.filter(m => m.membershipStatus === 'active'));
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchAttendance = async (sessionId: string) => {
    try {
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('sessionId', '==', sessionId)
      );
      const querySnapshot = await getDocs(attendanceQuery);
      const attendanceList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Attendance[];
      
      setExistingAttendance(attendanceList);
      
      // Initialize attendance state
      const attendanceState: Record<string, boolean> = {};
      attendanceList.forEach(att => {
        attendanceState[att.memberId] = att.status === 'attended';
      });
      setAttendance(attendanceState);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleAttendanceChange = (memberId: string, checked: boolean) => {
    setAttendance(prev => ({ ...prev, [memberId]: checked }));
  };

  const handleSave = async () => {
    if (!selectedSession) return;
    
    setLoading(true);
    setSuccess(false);

    try {
      const session = sessions.find(s => s.id === selectedSession);
      if (!session) return;

      let attendedCount = 0;

      // Save attendance records
      for (const member of members) {
        const isAttended = attendance[member.uid] || false;
        const existingRecord = existingAttendance.find(att => att.memberId === member.uid);

        if (existingRecord) {
          // Update existing record
          await updateDoc(doc(db, 'attendance', existingRecord.id), {
            status: isAttended ? 'attended' : 'no_show',
            updatedAt: Timestamp.now(),
          });
        } else if (isAttended) {
          // Create new record only if attended
          await addDoc(collection(db, 'attendance'), {
            sessionId: selectedSession,
            memberId: member.uid,
            memberName: member.name,
            status: 'attended',
            rsvpAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
        }

        if (isAttended) attendedCount++;
      }

      // Update session attendance count
      await updateDoc(doc(db, 'sessions', selectedSession), {
        currentAttendance: attendedCount,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Attendance Tracking
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <FormControl fullWidth>
            <InputLabel>Select Session</InputLabel>
            <Select
              value={selectedSession}
              label="Select Session"
              onChange={(e) => setSelectedSession(e.target.value)}
            >
              {sessions.map(session => (
                <MenuItem key={session.id} value={session.id}>
                  {format(session.date, 'EEEE, MMMM d, yyyy')} - {session.startTime} -{' '}
                  {session.type} @ {session.locationName || 'Unknown'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {selectedSession && (
        <>
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Attendance saved successfully!
            </Alert>
          )}

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Mark Attendance
              </Typography>
              <Grid container spacing={2}>
                {members.map(member => (
                  <Grid item xs={12} sm={6} md={4} key={member.uid}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar 
                        src={member.photoUrl || undefined}
                        sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
                      >
                        {!member.photoUrl && member.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={attendance[member.uid] || false}
                            onChange={(e) => handleAttendanceChange(member.uid, e.target.checked)}
                          />
                        }
                        label={member.name}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
              <Box mt={3}>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={loading}
                  size="large"
                >
                  {loading ? 'Saving...' : 'Save Attendance'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default AttendanceTracking;
