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
  Chip,
  IconButton,
  FormControlLabel,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Tooltip,
  Alert,
} from '@mui/material';
import { Add, Delete, Edit, People, Event } from '@mui/icons-material';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Session, PoolLocation } from '../../types';
import { format, addWeeks, isBefore, startOfDay } from 'date-fns';

const SessionManagement: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [locations, setLocations] = useState<PoolLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [tabValue, setTabValue] = useState(0); // 0 = upcoming, 1 = past
  const [defaultPriceBoard] = useState(5);
  const [defaultPriceMember] = useState(7);

  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    locationId: '',
    type: 'pool' as 'pool' | 'open_water' | 'theory' | 'competition',
    capacity: 10,
    description: '',
    priceBoard: 5,
    priceMember: 7,
    repeatWeekly: false,
    repeatEndDate: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch locations
      const locationsQuery = query(collection(db, 'locations'), where('isActive', '==', true));
      const locationsSnapshot = await getDocs(locationsQuery);
      const locationsList = locationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as PoolLocation[];
      setLocations(locationsList);

      // Fetch all sessions
      const sessionsQuery = query(
        collection(db, 'sessions'),
        orderBy('date', 'asc')
      );
      const querySnapshot = await getDocs(sessionsQuery);
      const sessionsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        repeatEndDate: doc.data().repeatEndDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Session[];
      setSessions(sessionsList);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (session?: Session) => {
    if (session) {
      setSelectedSession(session);
      setFormData({
        date: format(session.date, 'yyyy-MM-dd'),
        startTime: session.startTime,
        endTime: session.endTime,
        locationId: session.locationId,
        type: session.type,
        capacity: session.capacity,
        description: session.description || '',
        priceBoard: session.priceBoard,
        priceMember: session.priceMember,
        repeatWeekly: session.repeatWeekly || false,
        repeatEndDate: session.repeatEndDate ? format(session.repeatEndDate, 'yyyy-MM-dd') : '',
      });
    } else {
      setSelectedSession(null);
      setFormData({
        date: '',
        startTime: '',
        endTime: '',
        locationId: locations.length > 0 ? locations[0].id : '',
        type: 'pool',
        capacity: 10,
        description: '',
        priceBoard: defaultPriceBoard,
        priceMember: defaultPriceMember,
        repeatWeekly: false,
        repeatEndDate: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSession(null);
  };

  const handleSave = async () => {
    try {
      if (!formData.date || !formData.startTime || !formData.endTime || !formData.locationId) {
        alert('Please fill in all required fields');
        return;
      }

      const location = locations.find(l => l.id === formData.locationId);
      if (!location) {
        alert('Please select a valid location');
        return;
      }

      const sessionDate = new Date(formData.date);
      const baseSessionData = {
        startTime: formData.startTime,
        endTime: formData.endTime,
        locationId: formData.locationId,
        locationName: location.name,
        type: formData.type,
        capacity: formData.capacity,
        description: formData.description,
        priceBoard: formData.priceBoard,
        priceMember: formData.priceMember,
        repeatWeekly: formData.repeatWeekly,
        createdBy: 'admin',
      };

      if (selectedSession) {
        // Update existing session
        await updateDoc(doc(db, 'sessions', selectedSession.id), {
          ...baseSessionData,
          date: Timestamp.fromDate(sessionDate),
          repeatEndDate: formData.repeatEndDate ? Timestamp.fromDate(new Date(formData.repeatEndDate)) : null,
          updatedAt: Timestamp.now(),
        });
      } else {
        // Create new session(s)
        if (formData.repeatWeekly && formData.repeatEndDate) {
          // Create multiple sessions
          const endDate = new Date(formData.repeatEndDate);
          let currentDate = sessionDate;
          const batch = writeBatch(db);
          let sessionCount = 0;

          while (isBefore(currentDate, endDate) || currentDate.getTime() === endDate.getTime()) {
            const sessionRef = doc(collection(db, 'sessions'));
            batch.set(sessionRef, {
              ...baseSessionData,
              date: Timestamp.fromDate(currentDate),
              repeatEndDate: Timestamp.fromDate(endDate),
              currentAttendance: 0,
              createdAt: Timestamp.now(),
            });
            currentDate = addWeeks(currentDate, 1);
            sessionCount++;
            
            // Firestore batch limit is 500
            if (sessionCount >= 100) break;
          }

          await batch.commit();
          alert(`Created ${sessionCount} weekly sessions`);
        } else {
          // Create single session
          await addDoc(collection(db, 'sessions'), {
            ...baseSessionData,
            date: Timestamp.fromDate(sessionDate),
            currentAttendance: 0,
            createdAt: Timestamp.now(),
          });
        }
      }

      await fetchData();
      handleCloseDialog();
    } catch (error: any) {
      console.error('Error saving session:', error);
      alert('Failed to save session: ' + error.message);
    }
  };

  const handleDeleteSession = async (session: Session) => {
    if (!window.confirm(`Are you sure you want to delete this session on ${format(session.date, 'MMM d, yyyy')}?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'sessions', session.id));
      await fetchData();
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session');
    }
  };

  const today = startOfDay(new Date());
  const upcomingSessions = sessions.filter(s => s.date >= today);
  const pastSessions = sessions.filter(s => s.date < today).reverse();

  const sessionTypeColors: Record<string, any> = {
    pool: 'primary',
    open_water: 'info',
    theory: 'secondary',
    competition: 'error',
  };

  const SessionTable = ({ sessionList }: { sessionList: Session[] }) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Time</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Type</TableCell>
            <TableCell align="center">Capacity</TableCell>
            <TableCell align="right">Price (Board/Member)</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sessionList.map((session) => (
            <TableRow key={session.id} hover>
              <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                  <Event fontSize="small" color="action" />
                  {format(session.date, 'EEE, MMM d, yyyy')}
                </Box>
              </TableCell>
              <TableCell>{session.startTime} - {session.endTime}</TableCell>
              <TableCell>{session.locationName}</TableCell>
              <TableCell>
                <Chip
                  label={session.type.replace('_', ' ')}
                  color={sessionTypeColors[session.type]}
                  size="small"
                />
              </TableCell>
              <TableCell align="center">
                <Tooltip title={`${session.currentAttendance} subscribed`}>
                  <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                    <People fontSize="small" />
                    {session.currentAttendance}/{session.capacity}
                  </Box>
                </Tooltip>
              </TableCell>
              <TableCell align="right">
                €{session.priceBoard?.toFixed(2) || '0.00'} / €{session.priceMember?.toFixed(2) || '0.00'}
              </TableCell>
              <TableCell align="center">
                <IconButton
                  color="primary"
                  size="small"
                  onClick={() => handleOpenDialog(session)}
                >
                  <Edit />
                </IconButton>
                <IconButton
                  color="error"
                  size="small"
                  onClick={() => handleDeleteSession(session)}
                >
                  <Delete />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {sessionList.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <Typography variant="body2" color="text.secondary" py={2}>
                  No sessions found
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Session Management</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          disabled={locations.length === 0}
        >
          Create Session
        </Button>
      </Box>

      {locations.length === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please add a pool location first before creating sessions.
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label={`Upcoming Sessions (${upcomingSessions.length})`} />
          <Tab label={`Past Sessions (${pastSessions.length})`} />
        </Tabs>
      </Box>

      {tabValue === 0 && <SessionTable sessionList={upcomingSessions} />}
      {tabValue === 1 && <SessionTable sessionList={pastSessions} />}

      {/* Create/Edit Session Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{selectedSession ? 'Edit Session' : 'Create New Session'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: format(new Date(), 'yyyy-MM-dd') }}
                required
              />
            </Grid>
            <Grid item xs={6} md={3}>
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
            <Grid item xs={6} md={3}>
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Location"
                value={formData.locationId}
                onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                required
              >
                {locations.map((location) => (
                  <MenuItem key={location.id} value={location.id}>
                    {location.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} md={3}>
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
            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                label="Capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                inputProps={{ min: 1 }}
                required
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                label="Price (Board Members)"
                type="number"
                value={formData.priceBoard}
                onChange={(e) => setFormData({ ...formData, priceBoard: parseFloat(e.target.value) })}
                InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>€</Typography> }}
                inputProps={{ min: 0, step: 0.5 }}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                label="Price (Members)"
                type="number"
                value={formData.priceMember}
                onChange={(e) => setFormData({ ...formData, priceMember: parseFloat(e.target.value) })}
                InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>€</Typography> }}
                inputProps={{ min: 0, step: 0.5 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            
            {!selectedSession && (
              <>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.repeatWeekly}
                        onChange={(e) => setFormData({ ...formData, repeatWeekly: e.target.checked })}
                      />
                    }
                    label="Repeat weekly"
                  />
                </Grid>
                {formData.repeatWeekly && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Repeat Until"
                      type="date"
                      value={formData.repeatEndDate}
                      onChange={(e) => setFormData({ ...formData, repeatEndDate: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ min: formData.date }}
                      required
                      helperText="Sessions will be created weekly until this date"
                    />
                  </Grid>
                )}
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {selectedSession ? 'Update' : 'Create'} Session
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SessionManagement;
