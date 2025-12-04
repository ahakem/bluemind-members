import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Session } from '../../types';
import { format, startOfWeek, addDays } from 'date-fns';

const SessionManagement: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    type: 'pool' as 'pool' | 'open_water' | 'theory' | 'competition',
    capacity: 10,
    description: '',
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('date', '>=', Timestamp.fromDate(weekStart)),
        orderBy('date', 'asc')
      );
      const querySnapshot = await getDocs(sessionsQuery);
      const sessionsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Session[];
      setSessions(sessionsList);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      date: '',
      startTime: '',
      endTime: '',
      location: '',
      type: 'pool',
      capacity: 10,
      description: '',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSave = async () => {
    try {
      // Validate form data
      if (!formData.date || !formData.startTime || !formData.endTime || !formData.location) {
        alert('Please fill in all required fields');
        return;
      }

      console.log('📝 Creating session with data:', formData);
      
      const sessionDate = new Date(formData.date);
      console.log('📅 Session date:', sessionDate);
      
      const sessionData = {
        date: Timestamp.fromDate(sessionDate),
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location,
        type: formData.type,
        capacity: formData.capacity,
        currentAttendance: 0,
        description: formData.description,
        createdBy: 'admin',
        createdAt: Timestamp.now(),
      };

      console.log('💾 Saving to Firestore:', sessionData);
      const docRef = await addDoc(collection(db, 'sessions'), sessionData);
      console.log('✅ Session created with ID:', docRef.id);
      
      await fetchSessions();
      handleCloseDialog();
      alert('Session created successfully!');
    } catch (error: any) {
      console.error('❌ Error creating session:', error);
      alert('Failed to create session: ' + error.message);
    }
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Session Management</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenDialog}
        >
          Create Session
        </Button>
      </Box>

      <Typography variant="h6" gutterBottom>
        This Week's Schedule
      </Typography>

      <Grid container spacing={2}>
        {getSessionsByDay().map(({ date, sessions: daySessions }) => (
          <Grid item xs={12} md={6} lg={4} key={date.toISOString()}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {format(date, 'EEEE, MMM d')}
                </Typography>
                {daySessions.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No sessions scheduled
                  </Typography>
                ) : (
                  daySessions.map(session => (
                    <Box key={session.id} mb={2} p={2} bgcolor="background.default" borderRadius={1}>
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
                      <Typography variant="body2" color="text.secondary">
                        Capacity: {session.currentAttendance}/{session.capacity}
                      </Typography>
                      {session.description && (
                        <Typography variant="body2" color="text.secondary" mt={1}>
                          {session.description}
                        </Typography>
                      )}
                    </Box>
                  ))
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Session</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: format(new Date(), 'yyyy-MM-dd')
                }}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Start Time"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="End Time"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                select
                label="Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                required
              >
                <MenuItem value="pool">Pool</MenuItem>
                <MenuItem value="open_water">Open Water</MenuItem>
                <MenuItem value="theory">Theory</MenuItem>
                <MenuItem value="competition">Competition</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Create Session
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SessionManagement;
