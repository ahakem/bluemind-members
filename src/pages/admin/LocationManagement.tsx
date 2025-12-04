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
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Snackbar,
  Alert,
  Tooltip,
} from '@mui/material';
import { Add, Edit, Delete, ContentCopy, Check } from '@mui/icons-material';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { PoolLocation, BankDetails } from '../../types';

const LocationManagement: React.FC = () => {
  const [locations, setLocations] = useState<PoolLocation[]>([]);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [openLocationDialog, setOpenLocationDialog] = useState(false);
  const [openBankDialog, setOpenBankDialog] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<PoolLocation | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [locationForm, setLocationForm] = useState({
    name: '',
    address: '',
    description: '',
  });

  const [bankForm, setBankForm] = useState({
    accountHolder: '',
    iban: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch locations
      const locationsQuery = query(collection(db, 'locations'), orderBy('name', 'asc'));
      const locationsSnapshot = await getDocs(locationsQuery);
      const locationsList = locationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as PoolLocation[];
      setLocations(locationsList);

      // Fetch bank details
      const bankSnapshot = await getDocs(collection(db, 'bankDetails'));
      if (!bankSnapshot.empty) {
        const bankDoc = bankSnapshot.docs[0];
        setBankDetails({
          id: bankDoc.id,
          ...bankDoc.data(),
          createdAt: bankDoc.data().createdAt?.toDate(),
          updatedAt: bankDoc.data().updatedAt?.toDate(),
        } as BankDetails);
        setBankForm({
          accountHolder: bankDoc.data().accountHolder || '',
          iban: bankDoc.data().iban || '',
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Location handlers
  const handleOpenLocationDialog = (location?: PoolLocation) => {
    if (location) {
      setSelectedLocation(location);
      setLocationForm({
        name: location.name,
        address: location.address,
        description: location.description || '',
      });
    } else {
      setSelectedLocation(null);
      setLocationForm({ name: '', address: '', description: '' });
    }
    setOpenLocationDialog(true);
  };

  const handleCloseLocationDialog = () => {
    setOpenLocationDialog(false);
    setSelectedLocation(null);
  };

  const handleSaveLocation = async () => {
    if (!locationForm.name || !locationForm.address) {
      setSnackbar({ open: true, message: 'Please fill in name and address', severity: 'error' });
      return;
    }

    try {
      if (selectedLocation) {
        // Update existing location
        await updateDoc(doc(db, 'locations', selectedLocation.id), {
          name: locationForm.name,
          address: locationForm.address,
          description: locationForm.description,
          updatedAt: Timestamp.now(),
        });
        setSnackbar({ open: true, message: 'Location updated successfully', severity: 'success' });
      } else {
        // Create new location
        await addDoc(collection(db, 'locations'), {
          name: locationForm.name,
          address: locationForm.address,
          description: locationForm.description,
          isActive: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        setSnackbar({ open: true, message: 'Location created successfully', severity: 'success' });
      }
      await fetchData();
      handleCloseLocationDialog();
    } catch (error) {
      console.error('Error saving location:', error);
      setSnackbar({ open: true, message: 'Error saving location', severity: 'error' });
    }
  };

  const handleDeleteLocation = async (location: PoolLocation) => {
    if (!window.confirm(`Are you sure you want to delete "${location.name}"?`)) return;

    try {
      await deleteDoc(doc(db, 'locations', location.id));
      setSnackbar({ open: true, message: 'Location deleted successfully', severity: 'success' });
      await fetchData();
    } catch (error) {
      console.error('Error deleting location:', error);
      setSnackbar({ open: true, message: 'Error deleting location', severity: 'error' });
    }
  };

  // Bank details handlers
  const handleOpenBankDialog = () => {
    setOpenBankDialog(true);
  };

  const handleCloseBankDialog = () => {
    setOpenBankDialog(false);
  };

  const handleSaveBankDetails = async () => {
    if (!bankForm.accountHolder || !bankForm.iban) {
      setSnackbar({ open: true, message: 'Please fill in all bank details', severity: 'error' });
      return;
    }

    try {
      if (bankDetails) {
        // Update existing bank details
        await updateDoc(doc(db, 'bankDetails', bankDetails.id), {
          accountHolder: bankForm.accountHolder,
          iban: bankForm.iban,
          updatedAt: Timestamp.now(),
        });
      } else {
        // Create new bank details
        await addDoc(collection(db, 'bankDetails'), {
          accountHolder: bankForm.accountHolder,
          iban: bankForm.iban,
          isDefault: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
      setSnackbar({ open: true, message: 'Bank details saved successfully', severity: 'success' });
      await fetchData();
      handleCloseBankDialog();
    } catch (error) {
      console.error('Error saving bank details:', error);
      setSnackbar({ open: true, message: 'Error saving bank details', severity: 'error' });
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatIban = (iban: string) => {
    // Format IBAN with spaces every 4 characters
    return iban.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Locations & Bank Details
      </Typography>

      {/* Bank Details Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Bank Details for Payments</Typography>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={handleOpenBankDialog}
            >
              {bankDetails ? 'Edit' : 'Add'} Bank Details
            </Button>
          </Box>
          {bankDetails ? (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" color="text.secondary">
                    Account Holder:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {bankDetails.accountHolder}
                  </Typography>
                  <Tooltip title={copiedField === 'holder' ? 'Copied!' : 'Copy'}>
                    <IconButton
                      size="small"
                      onClick={() => handleCopy(bankDetails.accountHolder, 'holder')}
                    >
                      {copiedField === 'holder' ? <Check color="success" /> : <ContentCopy fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" color="text.secondary">
                    IBAN:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" fontFamily="monospace">
                    {formatIban(bankDetails.iban)}
                  </Typography>
                  <Tooltip title={copiedField === 'iban' ? 'Copied!' : 'Copy'}>
                    <IconButton
                      size="small"
                      onClick={() => handleCopy(bankDetails.iban, 'iban')}
                    >
                      {copiedField === 'iban' ? <Check color="success" /> : <ContentCopy fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No bank details configured. Add bank details to receive payments.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Pool Locations Section */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Pool Locations</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenLocationDialog()}
        >
          Add Location
        </Button>
      </Box>

      <Grid container spacing={3}>
        {locations.map((location) => (
          <Grid item xs={12} md={6} lg={4} key={location.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start">
                  <Typography variant="h6" gutterBottom>
                    {location.name}
                  </Typography>
                  <Chip
                    label={location.isActive ? 'Active' : 'Inactive'}
                    color={location.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  📍 {location.address}
                </Typography>
                {location.description && (
                  <Typography variant="body2" color="text.secondary">
                    {location.description}
                  </Typography>
                )}
              </CardContent>
              <CardActions>
                <IconButton
                  color="primary"
                  onClick={() => handleOpenLocationDialog(location)}
                >
                  <Edit />
                </IconButton>
                <IconButton
                  color="error"
                  onClick={() => handleDeleteLocation(location)}
                >
                  <Delete />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
        {locations.length === 0 && !loading && (
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              No locations added yet. Click "Add Location" to create one.
            </Typography>
          </Grid>
        )}
      </Grid>

      {/* Location Dialog */}
      <Dialog open={openLocationDialog} onClose={handleCloseLocationDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedLocation ? 'Edit Location' : 'Add Location'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location Name"
                value={locationForm.name}
                onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                placeholder="e.g., Sportfondsenbad Amsterdam"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={locationForm.address}
                onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
                placeholder="e.g., Ijsbaanpad 43, 1076 CV Amsterdam"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={locationForm.description}
                onChange={(e) => setLocationForm({ ...locationForm, description: e.target.value })}
                multiline
                rows={2}
                placeholder="e.g., 25m pool with 2.5m depth"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLocationDialog}>Cancel</Button>
          <Button onClick={handleSaveLocation} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bank Details Dialog */}
      <Dialog open={openBankDialog} onClose={handleCloseBankDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Bank Details</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Account Holder Name"
                value={bankForm.accountHolder}
                onChange={(e) => setBankForm({ ...bankForm, accountHolder: e.target.value })}
                placeholder="e.g., Blue Mind Freediving"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="IBAN"
                value={bankForm.iban}
                onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value.toUpperCase() })}
                placeholder="e.g., NL12ABCD0123456789"
                required
                inputProps={{ style: { fontFamily: 'monospace' } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBankDialog}>Cancel</Button>
          <Button onClick={handleSaveBankDetails} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LocationManagement;
