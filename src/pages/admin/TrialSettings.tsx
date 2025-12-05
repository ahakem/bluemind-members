import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Grid,
  InputAdornment,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import { Settings, Euro, People, CardMembership, AccessTime } from '@mui/icons-material';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { TrialSettings as TrialSettingsType } from '../../types';

const TrialSettings: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [settings, setSettings] = useState<TrialSettingsType>({
    maxTrialSessions: 3,
    trialSessionPrice: 10,
    membershipFee: 25,
    cancellationDeadlineHours: 24,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'trialSettings'));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        setSettings({
          maxTrialSessions: data.maxTrialSessions || 3,
          trialSessionPrice: data.trialSessionPrice || 10,
          membershipFee: data.membershipFee || 25,
          cancellationDeadlineHours: data.cancellationDeadlineHours ?? 24,
          lastUpdatedBy: data.lastUpdatedBy,
          lastUpdatedAt: data.lastUpdatedAt?.toDate(),
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await setDoc(doc(db, 'settings', 'trialSettings'), {
        maxTrialSessions: settings.maxTrialSessions,
        trialSessionPrice: settings.trialSessionPrice,
        membershipFee: settings.membershipFee,
        cancellationDeadlineHours: settings.cancellationDeadlineHours,
        lastUpdatedBy: currentUser?.uid,
        lastUpdatedAt: Timestamp.now(),
      });
      setSuccess('Settings saved successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Loading settings...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Settings /> Trial & Membership Settings
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

      <Grid container spacing={3}>
        {/* Trial Sessions Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <People color="primary" /> Trial Sessions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Alert severity="info" sx={{ mb: 2 }}>
                Users who are approved but not yet active members can join a limited number of trial sessions at a special price.
              </Alert>

              <TextField
                fullWidth
                label="Maximum Trial Sessions"
                type="number"
                value={settings.maxTrialSessions}
                onChange={(e) => setSettings({ ...settings, maxTrialSessions: parseInt(e.target.value) || 0 })}
                inputProps={{ min: 0 }}
                helperText="Number of trial sessions a non-member can attend before becoming a member"
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Trial Session Price"
                type="number"
                value={settings.trialSessionPrice}
                onChange={(e) => setSettings({ ...settings, trialSessionPrice: parseFloat(e.target.value) || 0 })}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Euro /></InputAdornment>,
                }}
                inputProps={{ min: 0, step: 0.5 }}
                helperText="Price charged for each trial session"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Membership Fee Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CardMembership color="primary" /> Membership Fee
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Alert severity="info" sx={{ mb: 2 }}>
                This is the yearly fee users pay to become and remain active members. After payment confirmation, their membership status becomes "active" for one year.
              </Alert>

              <TextField
                fullWidth
                label="Membership Fee"
                type="number"
                value={settings.membershipFee}
                onChange={(e) => setSettings({ ...settings, membershipFee: parseFloat(e.target.value) || 0 })}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Euro /></InputAdornment>,
                }}
                inputProps={{ min: 0, step: 0.5 }}
                helperText="Yearly fee for club membership"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Cancellation Policy Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTime color="primary" /> Cancellation Policy
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Alert severity="info" sx={{ mb: 2 }}>
                Members can cancel a booking and receive a refund to their balance if they cancel before this deadline. After the deadline, no refund is given.
              </Alert>

              <TextField
                fullWidth
                label="Cancellation Deadline (hours before session)"
                type="number"
                value={settings.cancellationDeadlineHours}
                onChange={(e) => setSettings({ ...settings, cancellationDeadlineHours: parseInt(e.target.value) || 0 })}
                inputProps={{ min: 0 }}
                helperText="Hours before session start that cancellation with refund is allowed (e.g., 24 = 1 day before)"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Summary Card */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, bgcolor: 'background.default' }}>
            <Typography variant="h6" gutterBottom>
              Current Configuration Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h3" color="primary">
                    {settings.maxTrialSessions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Trial Sessions Allowed
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h3" color="success.main">
                    €{settings.trialSessionPrice.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Per Trial Session
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h3" color="info.main">
                    €{settings.membershipFee.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Yearly Membership
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h3" color="warning.main">
                    {settings.cancellationDeadlineHours}h
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cancel Deadline
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>
    </Box>
  );
};

export default TrialSettings;
