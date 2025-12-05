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
  Alert,
  Chip,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  OutlinedInput,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Edit, Warning, CheckCircle, Visibility, Delete } from '@mui/icons-material';
import {
  collection,
  getDocs,
  setDoc,
  updateDoc,
  doc,
  Timestamp,
  getDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Member, User } from '../../types';
import MemberDetailView from '../../components/MemberDetailView';
import { LONG_TERM_GROUPS } from './SessionManagement';

interface UserWithMember extends User {
  memberData?: Member;
  medicalStatus?: 'valid' | 'expiring_soon' | 'expired' | 'none';
}

const MemberManagement: React.FC = () => {
  const { userData } = useAuth();
  const isSuperAdmin = userData?.role === 'super-admin';
  const [users, setUsers] = useState<UserWithMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailView, setOpenDetailView] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithMember | null>(null);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<UserWithMember | null>(null);
  const [formData, setFormData] = useState({
    approved: false,
    role: 'member',
    isBoardMember: false,
    isLongTermMember: false,
    longTermGroups: [] as string[],
    balance: 0,
    phone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    medicalExpiryDate: '',
    membershipStatus: 'pending',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch all users from users collection
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList: UserWithMember[] = [];

      for (const userDoc of usersSnapshot.docs) {
        const userData = { id: userDoc.id, ...userDoc.data() } as unknown as User;
        
        // Try to fetch corresponding member data
        const memberDoc = await getDoc(doc(db, 'members', userDoc.id));
        let memberData: Member | undefined;
        let medicalStatus: 'valid' | 'expiring_soon' | 'expired' | 'none' = 'none';

        if (memberDoc.exists()) {
          const data = memberDoc.data();
          memberData = {
            id: memberDoc.id,
            ...data,
            medicalCertificate: {
              ...data.medicalCertificate,
              expiryDate: data.medicalCertificate?.expiryDate?.toDate(),
            },
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          } as unknown as Member;
          
          if (memberData.medicalCertificate?.expiryDate) {
            medicalStatus = calculateMedicalStatus(memberData.medicalCertificate.expiryDate);
          }
        }

        usersList.push({
          ...userData,
          memberData,
          medicalStatus,
        });
      }
      
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMedicalStatus = (expiryDate: Date | null): 'valid' | 'expiring_soon' | 'expired' | 'none' => {
    if (!expiryDate) return 'none';
    
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    
    if (expiryDate < now) return 'expired';
    if (expiryDate < thirtyDaysFromNow) return 'expiring_soon';
    return 'valid';
  };

  const handleOpenDialog = (user?: UserWithMember) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        approved: user.approved || false,
        role: user.role || 'member',
        isBoardMember: (user as any).isBoardMember || false,
        isLongTermMember: user.memberData?.isLongTermMember || false,
        longTermGroups: user.memberData?.longTermGroups || [],
        balance: user.memberData?.balance || 0,
        phone: user.memberData?.phone || '',
        emergencyContactName: user.memberData?.emergencyContact?.name || '',
        emergencyContactPhone: user.memberData?.emergencyContact?.phone || '',
        emergencyContactRelationship: user.memberData?.emergencyContact?.relationship || '',
        medicalExpiryDate: user.memberData?.medicalCertificate?.expiryDate
          ? user.memberData.medicalCertificate.expiryDate.toISOString().split('T')[0]
          : '',
        membershipStatus: user.memberData?.membershipStatus || 'pending',
      });
    } else {
      setSelectedUser(null);
      setFormData({
        approved: false,
        role: 'member',
        isBoardMember: false,
        isLongTermMember: false,
        longTermGroups: [],
        balance: 0,
        phone: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelationship: '',
        medicalExpiryDate: '',
        membershipStatus: 'pending',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
  };

  const handleOpenDetailView = (user: UserWithMember) => {
    setSelectedUserForDetail(user);
    setOpenDetailView(true);
  };

  const handleCloseDetailView = () => {
    setOpenDetailView(false);
    setSelectedUserForDetail(null);
  };

  const handleSave = async () => {
    if (!selectedUser) return;

    try {
      // Update user document (role, approval status, and board member flag)
      await updateDoc(doc(db, 'users', selectedUser.uid), {
        role: formData.role,
        approved: formData.approved,
        isBoardMember: formData.isBoardMember,
      });

      // Create or update member document
      const memberData: any = {
        uid: selectedUser.uid,
        name: selectedUser.name,
        email: selectedUser.email,
        phone: formData.phone,
        isLongTermMember: formData.isLongTermMember,
        longTermGroups: formData.longTermGroups,
        balance: formData.balance,
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelationship,
        },
        certifications: selectedUser.memberData?.certifications || [],
        membershipStatus: formData.membershipStatus,
        membershipExpiry: selectedUser.memberData?.membershipExpiry || null,
        medicalCertificate: {
          expiryDate: formData.medicalExpiryDate 
            ? Timestamp.fromDate(new Date(formData.medicalExpiryDate))
            : null,
          status: formData.medicalExpiryDate ? calculateMedicalStatus(new Date(formData.medicalExpiryDate)) : 'expired',
        },
        personalBests: selectedUser.memberData?.personalBests || {
          STA: null,
          DYN: null,
          DNF: null,
          CWT: null,
        },
        updatedAt: Timestamp.now(),
      };

      // If member document doesn't exist, add createdAt
      if (!selectedUser.memberData) {
        memberData.createdAt = Timestamp.now();
      }

      await setDoc(doc(db, 'members', selectedUser.uid), memberData, { merge: true });

      await fetchUsers();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving member:', error);
      alert('Error saving member data. Please try again.');
    }
  };

  const handleDeleteUser = async (user: UserWithMember) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.name}?\n\n` +
      `This will:\n` +
      `• Remove user data from the database\n` +
      `• Remove member profile data\n\n` +
      `Note: The user's Firebase Authentication account must be manually deleted from the Firebase Console.\n\n` +
      `This action cannot be undone.`
    );
    
    if (!confirmed) {
      return;
    }
    
    try {
      // Delete from both Firestore collections
      await deleteDoc(doc(db, 'users', user.uid));
      await deleteDoc(doc(db, 'members', user.uid));
      
      // Also delete any related data
      // Delete user's attendance records
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('memberId', '==', user.uid)
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const attendanceDeletes = attendanceSnapshot.docs.map(d => deleteDoc(doc(db, 'attendance', d.id)));
      await Promise.all(attendanceDeletes);
      
      // Delete user's invoices
      const invoicesQuery = query(
        collection(db, 'invoices'),
        where('memberId', '==', user.uid)
      );
      const invoicesSnapshot = await getDocs(invoicesQuery);
      const invoiceDeletes = invoicesSnapshot.docs.map(d => deleteDoc(doc(db, 'invoices', d.id)));
      await Promise.all(invoiceDeletes);
      
      await fetchUsers();
      alert(`${user.name} has been deleted from the database.\n\nRemember: You must also delete the user from Firebase Authentication Console manually.`);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user. Please try again.');
    }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'email', headerName: 'Email', width: 250 },
    { 
      field: 'phone', 
      headerName: 'Phone', 
      width: 130,
      valueGetter: (params) => params.row.memberData?.phone || 'N/A',
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 100,
      renderCell: (params: GridRenderCellParams) => {
        const role = params.value as string;
        let color: any = 'default';
        if (role === 'admin' || role === 'super-admin') color = 'error';
        else if (role === 'coach') color = 'primary';
        return <Chip label={role} color={color} size="small" />;
      },
    },
    {
      field: 'isBoardMember',
      headerName: 'Board',
      width: 80,
      renderCell: (params: GridRenderCellParams) => {
        const isBoard = params.value as boolean;
        return isBoard ? <Chip label="Yes" color="secondary" size="small" /> : null;
      },
    },
    {
      field: 'isLongTermMember',
      headerName: 'Long-term',
      width: 90,
      valueGetter: (params) => params.row.memberData?.isLongTermMember || false,
      renderCell: (params: GridRenderCellParams) => {
        return params.value ? <Chip label="Yes" color="info" size="small" /> : null;
      },
    },
    {
      field: 'balance',
      headerName: 'Balance',
      width: 90,
      valueGetter: (params) => params.row.memberData?.balance || 0,
      renderCell: (params: GridRenderCellParams) => {
        const balance = params.value as number;
        return balance > 0 ? (
          <Chip label={`€${balance.toFixed(2)}`} color="success" size="small" variant="outlined" />
        ) : null;
      },
    },
    {
      field: 'approved',
      headerName: 'Approved',
      width: 100,
      renderCell: (params: GridRenderCellParams) => {
        const approved = params.value as boolean;
        return (
          <Chip 
            label={approved ? 'Yes' : 'Pending'} 
            color={approved ? 'success' : 'warning'} 
            size="small" 
          />
        );
      },
    },
    {
      field: 'membershipStatus',
      headerName: 'Membership',
      width: 110,
      valueGetter: (params) => params.row.memberData?.membershipStatus || 'N/A',
      renderCell: (params: GridRenderCellParams) => {
        const status = params.row.memberData?.membershipStatus;
        if (!status) return <Chip label="N/A" size="small" />;
        const color =
          status === 'active' ? 'success' : status === 'pending' ? 'warning' : 'default';
        return <Chip label={status} color={color} size="small" />;
      },
    },
    {
      field: 'medicalStatus',
      headerName: 'Medical Status',
      width: 180,
      renderCell: (params: GridRenderCellParams) => {
        const status = params.value as string;
        if (status === 'none') {
          return <Chip label="Not Set" size="small" />;
        }
        if (status === 'expired') {
          return (
            <Chip
              icon={<Warning />}
              label="Expired"
              color="error"
              size="small"
            />
          );
        }
        if (status === 'expiring_soon') {
          return (
            <Chip
              icon={<Warning />}
              label="Expiring Soon"
              color="warning"
              size="small"
            />
          );
        }
        return (
          <Chip
            icon={<CheckCircle />}
            label="Valid"
            color="success"
            size="small"
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: isSuperAdmin ? 200 : 150,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <IconButton
            color="info"
            size="small"
            onClick={() => handleOpenDetailView(params.row as UserWithMember)}
            title="View Details"
          >
            <Visibility />
          </IconButton>
          <IconButton
            color="primary"
            size="small"
            onClick={() => handleOpenDialog(params.row as UserWithMember)}
            title="Edit"
          >
            <Edit />
          </IconButton>
          {isSuperAdmin && (
            <IconButton
              color="error"
              size="small"
              onClick={() => handleDeleteUser(params.row as UserWithMember)}
              title="Delete User"
            >
              <Delete />
            </IconButton>
          )}
        </Box>
      ),
    },
  ];

  // Filter pending users for review
  const pendingUsers = users.filter(u => !u.approved);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Member Management</Typography>
      
      {pendingUsers.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <strong>{pendingUsers.length} user(s)</strong> pending approval.
        </Alert>
      )}

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={users}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.uid}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
        />
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Edit User: {selectedUser?.name}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  label="Role"
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <MenuItem value="member">Member</MenuItem>
                  <MenuItem value="coach">Coach</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Approval Status</InputLabel>
                <Select
                  value={formData.approved}
                  label="Approval Status"
                  onChange={(e) => setFormData({ ...formData, approved: e.target.value === 'true' })}
                >
                  <MenuItem value="false">Pending</MenuItem>
                  <MenuItem value="true">Approved</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isBoardMember}
                    onChange={(e) => setFormData({ ...formData, isBoardMember: e.target.checked })}
                  />
                }
                label="Board Member (gets board member pricing)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isLongTermMember}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      isLongTermMember: e.target.checked,
                      // Clear groups if unchecked
                      longTermGroups: e.target.checked ? formData.longTermGroups : []
                    })}
                  />
                }
                label="Long-term Member"
              />
            </Grid>
            {formData.isLongTermMember && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Long-Term Groups</InputLabel>
                  <Select
                    multiple
                    value={formData.longTermGroups}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      longTermGroups: typeof e.target.value === 'string' 
                        ? e.target.value.split(',') 
                        : e.target.value 
                    })}
                    input={<OutlinedInput label="Long-Term Groups" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip 
                            key={value} 
                            label={LONG_TERM_GROUPS.find(g => g.value === value)?.label || value}
                            size="small"
                            color="success"
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {LONG_TERM_GROUPS.map((group) => (
                      <MenuItem key={group.value} value={group.value}>
                        <Checkbox checked={formData.longTermGroups.includes(group.value)} />
                        {group.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Alert severity="info" sx={{ mt: 1 }}>
                  Member can join sessions for free if they belong to a group that the session allows.
                  "Unlimited" group has free access to all sessions.
                </Alert>
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Account Balance (€)"
                type="number"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                helperText="Member's prepaid credit balance"
                InputProps={{
                  startAdornment: <InputAdornment position="start">€</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Membership Status</InputLabel>
                <Select
                  value={formData.membershipStatus}
                  label="Membership Status"
                  onChange={(e) => setFormData({ ...formData, membershipStatus: e.target.value })}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Medical Certificate Expiry"
                type="date"
                value={formData.medicalExpiryDate}
                onChange={(e) =>
                  setFormData({ ...formData, medicalExpiryDate: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Emergency Contact
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Contact Name"
                value={formData.emergencyContactName}
                onChange={(e) =>
                  setFormData({ ...formData, emergencyContactName: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Contact Phone"
                value={formData.emergencyContactPhone}
                onChange={(e) =>
                  setFormData({ ...formData, emergencyContactPhone: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Relationship"
                value={formData.emergencyContactRelationship}
                onChange={(e) =>
                  setFormData({ ...formData, emergencyContactRelationship: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <MemberDetailView
        open={openDetailView}
        onClose={handleCloseDetailView}
        member={selectedUserForDetail?.memberData || null}
        user={selectedUserForDetail || null}
      />
    </Box>
  );
};

export default MemberManagement;
