import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  Avatar,
  CircularProgress,
} from '@mui/material';
import { Add, Delete, Info, Lock, Visibility, VisibilityOff, CameraAlt } from '@mui/icons-material';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { Member } from '../../types';

const MemberProfile: React.FC = () => {
  const { currentUser } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openCertDialog, setOpenCertDialog] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nickname: '',
    street: '',
    city: '',
    postalCode: '',
    country: '',
    phone: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelationship: '',
    STA: '',
    DYN: '',
    DYNBIFI: '',
    DNF: '',
    CWT: '',
    CWTB: '',
    CNF: '',
  });

  const [newCert, setNewCert] = useState({
    organization: '',
    level: '',
    date: '',
  });

  // Password change state
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    fetchMemberData();
  }, [currentUser]);

  const fetchMemberData = async () => {
    if (!currentUser) return;

    try {
      const memberDoc = await getDoc(doc(db, 'members', currentUser.uid));
      if (memberDoc.exists()) {
        const data = memberDoc.data() as any;
        const memberData: Member = {
          ...data,
          id: memberDoc.id,
          dateOfBirth: data.dateOfBirth?.toDate(),
          registrationDate: data.registrationDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
        setMember(memberData);

        // Populate form
        setFormData({
          nickname: memberData.nickname || '',
          street: memberData.address?.street || '',
          city: memberData.address?.city || '',
          postalCode: memberData.address?.postalCode || '',
          country: memberData.address?.country || '',
          phone: memberData.phone || '',
          emergencyName: memberData.emergencyContact?.name || '',
          emergencyPhone: memberData.emergencyContact?.phone || '',
          emergencyRelationship: memberData.emergencyContact?.relationship || '',
          STA: memberData.personalBests?.STA || '',
          DYN: memberData.personalBests?.DYN?.toString() || '',
          DYNBIFI: memberData.personalBests?.DYNBIFI?.toString() || '',
          DNF: memberData.personalBests?.DNF?.toString() || '',
          CWT: memberData.personalBests?.CWT?.toString() || '',
          CWTB: memberData.personalBests?.CWTB?.toString() || '',
          CNF: memberData.personalBests?.CNF?.toString() || '',
        });
      }
    } catch (err) {
      console.error('Error fetching member data:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser || !member) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updateData = {
        nickname: formData.nickname || null,
        address: {
          street: formData.street,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
        },
        phone: formData.phone,
        emergencyContact: {
          name: formData.emergencyName,
          phone: formData.emergencyPhone,
          relationship: formData.emergencyRelationship,
        },
        personalBests: {
          STA: formData.STA || null,
          DYN: formData.DYN ? Number(formData.DYN) : null,
          DYNBIFI: formData.DYNBIFI ? Number(formData.DYNBIFI) : null,
          DNF: formData.DNF ? Number(formData.DNF) : null,
          CWT: formData.CWT ? Number(formData.CWT) : null,
          CWTB: formData.CWTB ? Number(formData.CWTB) : null,
          CNF: formData.CNF ? Number(formData.CNF) : null,
        },
        updatedAt: Timestamp.now(),
      };

      await updateDoc(doc(db, 'members', currentUser.uid), updateData);
      setSuccess('Profile updated successfully!');
      fetchMemberData();
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCertification = async () => {
    if (!currentUser || !member || !newCert.organization || !newCert.level || !newCert.date) {
      setError('Please fill in all certification fields');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const updatedCerts = [
        ...(member.certifications || []),
        {
          organization: newCert.organization,
          level: newCert.level,
          date: Timestamp.fromDate(new Date(newCert.date)),
        },
      ];

      await updateDoc(doc(db, 'members', currentUser.uid), {
        certifications: updatedCerts,
        updatedAt: Timestamp.now(),
      });

      setNewCert({ organization: '', level: '', date: '' });
      setOpenCertDialog(false);
      setSuccess('Certification added successfully!');
      fetchMemberData();
    } catch (err: any) {
      console.error('Error adding certification:', err);
      setError(err.message || 'Failed to add certification');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCertification = async (index: number) => {
    if (!currentUser || !member) return;

    if (!window.confirm('Are you sure you want to delete this certification?')) return;

    setSaving(true);
    setError('');

    try {
      const updatedCerts = member.certifications.filter((_, i) => i !== index);

      await updateDoc(doc(db, 'members', currentUser.uid), {
        certifications: updatedCerts,
        updatedAt: Timestamp.now(),
      });

      setSuccess('Certification deleted successfully!');
      fetchMemberData();
    } catch (err: any) {
      console.error('Error deleting certification:', err);
      setError(err.message || 'Failed to delete certification');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentUser) return;

    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!passwordData.currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    if (!passwordData.newPassword) {
      setPasswordError('New password is required');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setSaving(true);

    try {
      // Re-authenticate user first
      const credential = EmailAuthProvider.credential(
        currentUser.email!,
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, passwordData.newPassword);

      setPasswordSuccess('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setOpenPasswordDialog(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (err: any) {
      console.error('Error changing password:', err);
      if (err.code === 'auth/wrong-password') {
        setPasswordError('Current password is incorrect');
      } else if (err.code === 'auth/weak-password') {
        setPasswordError('New password is too weak');
      } else {
        setPasswordError(err.message || 'Failed to change password');
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Only PNG and JPG images are allowed');
      return;
    }

    // Validate file size (1MB = 1048576 bytes)
    if (file.size > 1048576) {
      setError('Photo must be less than 1MB');
      return;
    }

    setUploadingPhoto(true);
    setError('');

    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `profile-photos/${currentUser.uid}.${fileExtension}`;
      const storageRef = ref(storage, fileName);

      await uploadBytes(storageRef, file);
      const photoUrl = await getDownloadURL(storageRef);

      // Update member document with photo URL
      await updateDoc(doc(db, 'members', currentUser.uid), {
        photoUrl,
        updatedAt: Timestamp.now(),
      });

      setSuccess('Profile photo updated!');
      fetchMemberData();
    } catch (err: any) {
      console.error('Error uploading photo:', err);
      setError(err.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!member) {
    return (
      <Alert severity="error">
        Member data not found. Please contact administration.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Profile
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
        {/* Profile Photo & Personal Information */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            <Grid container spacing={2}>
              {/* Profile Photo */}
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    src={member.photoUrl || undefined}
                    sx={{ 
                      width: 120, 
                      height: 120, 
                      fontSize: '3rem',
                      bgcolor: 'primary.main',
                      cursor: 'pointer',
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <IconButton
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      bgcolor: 'background.paper',
                      boxShadow: 1,
                      '&:hover': { bgcolor: 'grey.100' },
                    }}
                    size="small"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                  >
                    {uploadingPhoto ? (
                      <CircularProgress size={20} />
                    ) : (
                      <CameraAlt fontSize="small" />
                    )}
                  </IconButton>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    style={{ display: 'none' }}
                    onChange={handlePhotoUpload}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Click to upload photo (PNG/JPG, max 1MB)
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={member.name}
                  disabled
                  helperText="Contact admin to change"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nickname"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  helperText="How you'd like to be called"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={member.email}
                  disabled
                  helperText="Contact admin to change"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Address */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Address
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Street"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Postal Code"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Emergency Contact */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Emergency Contact
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.emergencyName}
                  onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Relationship"
                  value={formData.emergencyRelationship}
                  onChange={(e) => setFormData({ ...formData, emergencyRelationship: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.emergencyPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Certifications */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Freediving Certifications
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setOpenCertDialog(true)}
              >
                Add Certification
              </Button>
            </Box>
            {member.certifications && member.certifications.length > 0 ? (
              member.certifications.map((cert, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    mb: 1,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      {cert.organization} - {cert.level}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Date: {cert.date instanceof Date ? cert.date.toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Box>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteCertification(index)}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              ))
            ) : (
              <Typography color="text.secondary">No certifications added yet</Typography>
            )}
          </Paper>
        </Grid>

        {/* Personal Bests */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Personal Bests
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="STA (mm:ss)"
                  value={formData.STA}
                  onChange={(e) => {
                    // Allow only digits and colon, format as mm:ss
                    let value = e.target.value.replace(/[^0-9:]/g, '');
                    // Auto-insert colon after 2 digits if not present
                    if (value.length === 2 && !value.includes(':') && formData.STA.length < 2) {
                      value = value + ':';
                    }
                    // Limit to mm:ss format (max 5 chars)
                    if (value.length <= 5) {
                      setFormData({ ...formData, STA: value });
                    }
                  }}
                  placeholder="04:30"
                  helperText="Static Apnea (e.g., 04:30 for 4 min 30 sec)"
                  inputProps={{ maxLength: 5 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="DYN (meters)"
                  type="number"
                  value={formData.DYN}
                  onChange={(e) => setFormData({ ...formData, DYN: e.target.value })}
                  helperText="Dynamic with Fins"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="DYNBIFI (meters)"
                  type="number"
                  value={formData.DYNBIFI}
                  onChange={(e) => setFormData({ ...formData, DYNBIFI: e.target.value })}
                  helperText="Dynamic Bifins"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="DNF (meters)"
                  type="number"
                  value={formData.DNF}
                  onChange={(e) => setFormData({ ...formData, DNF: e.target.value })}
                  helperText="Dynamic No Fins"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="CWT (meters)"
                  type="number"
                  value={formData.CWT}
                  onChange={(e) => setFormData({ ...formData, CWT: e.target.value })}
                  helperText="Constant Weight"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="CWTB (meters)"
                  type="number"
                  value={formData.CWTB}
                  onChange={(e) => setFormData({ ...formData, CWTB: e.target.value })}
                  helperText="Constant Weight Bifins"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="CNF (meters)"
                  type="number"
                  value={formData.CNF}
                  onChange={(e) => setFormData({ ...formData, CNF: e.target.value })}
                  helperText="Constant No Fins"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Photography Consent - Read Only */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, bgcolor: 'grey.100' }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Info color="info" />
              <Typography variant="h6">
                Photography Consent
              </Typography>
            </Box>
            <Typography variant="body1" gutterBottom>
              Current Status: <strong>{member.photographyConsent ? 'Granted' : 'Not Granted'}</strong>
            </Typography>
            <Alert severity="info">
              To change your photography consent preference, please contact the club administration.
            </Alert>
          </Paper>
        </Grid>

        {/* Save Button */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button
              variant="outlined"
              onClick={fetchMemberData}
              disabled={saving}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              size="large"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Change Password Section */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Lock color="primary" />
            <Typography variant="h6">Security</Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Lock />}
            onClick={() => setOpenPasswordDialog(true)}
          >
            Change Password
          </Button>
        </Paper>
      </Grid>

      {/* Add Certification Dialog */}
      <Dialog open={openCertDialog} onClose={() => setOpenCertDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Freediving Certification</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Organization"
                placeholder="e.g., AIDA, SSI, PADI"
                value={newCert.organization}
                onChange={(e) => setNewCert({ ...newCert, organization: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Level"
                placeholder="e.g., AIDA 2, SSI Level 1"
                value={newCert.level}
                onChange={(e) => setNewCert({ ...newCert, level: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Certification Date"
                type="date"
                value={newCert.date}
                onChange={(e) => setNewCert({ ...newCert, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCertDialog(false)}>Cancel</Button>
          <Button onClick={handleAddCertification} variant="contained" disabled={saving}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog 
        open={openPasswordDialog} 
        onClose={() => {
          setOpenPasswordDialog(false);
          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setPasswordError('');
          setPasswordSuccess('');
        }} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          {passwordError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {passwordError}
            </Alert>
          )}
          {passwordSuccess && (
            <Alert severity="success" sx={{ mb: 2, mt: 1 }}>
              {passwordSuccess}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Current Password"
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        edge="end"
                      >
                        {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="New Password"
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                helperText="Minimum 6 characters"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        edge="end"
                      >
                        {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Confirm New Password"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        edge="end"
                      >
                        {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setOpenPasswordDialog(false);
              setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
              setPasswordError('');
              setPasswordSuccess('');
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleChangePassword} 
            variant="contained" 
            disabled={saving}
            startIcon={<Lock />}
          >
            {saving ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MemberProfile;
