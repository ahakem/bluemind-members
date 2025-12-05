import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Alert,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Card,
  CardContent,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Remove,
  AccountBalance,
  Receipt,
  Refresh,
  TrendingUp,
  TrendingDown,
  Payment,
  PersonAdd,
} from '@mui/icons-material';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
  getDocs,
  where,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { ClubTransaction, ClubTransactionType, ClubExpense, Member } from '../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ClubFinance: React.FC = () => {
  const { currentUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [clubBalance, setClubBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<ClubTransaction[]>([]);
  const [expenses, setExpenses] = useState<ClubExpense[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add Money Dialog
  const [addMoneyOpen, setAddMoneyOpen] = useState(false);
  const [addMoneyAmount, setAddMoneyAmount] = useState('');
  const [addMoneyReason, setAddMoneyReason] = useState('');

  // Pay Expense Dialog
  const [payExpenseOpen, setPayExpenseOpen] = useState(false);
  const [expenseVendor, setExpenseVendor] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  // Refund Dialog
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundMember, setRefundMember] = useState<Member | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundToMemberBalance, setRefundToMemberBalance] = useState(true);

  // Add to Member Balance Dialog
  const [addToMemberOpen, setAddToMemberOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberAddAmount, setMemberAddAmount] = useState('');
  const [memberAddReason, setMemberAddReason] = useState('');

  useEffect(() => {
    // Fetch club balance
    const balanceRef = doc(db, 'settings', 'clubBalance');
    const unsubBalance = onSnapshot(balanceRef, (doc) => {
      if (doc.exists()) {
        setClubBalance(doc.data().currentBalance || 0);
      }
    });

    // Fetch transactions
    const transactionsQuery = query(
      collection(db, 'clubTransactions'),
      orderBy('createdAt', 'desc')
    );
    const unsubTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      const txns: ClubTransaction[] = [];
      snapshot.forEach((doc) => {
        txns.push({ id: doc.id, ...doc.data() } as ClubTransaction);
      });
      setTransactions(txns);
      setLoading(false);
    });

    // Fetch expenses
    const expensesQuery = query(
      collection(db, 'clubExpenses'),
      orderBy('createdAt', 'desc')
    );
    const unsubExpenses = onSnapshot(expensesQuery, (snapshot) => {
      const exp: ClubExpense[] = [];
      snapshot.forEach((doc) => {
        exp.push({ id: doc.id, ...doc.data() } as ClubExpense);
      });
      setExpenses(exp);
    });

    // Fetch members for refund selection
    const membersQuery = query(collection(db, 'members'), orderBy('name'));
    const unsubMembers = onSnapshot(membersQuery, (snapshot) => {
      const mems: Member[] = [];
      snapshot.forEach((doc) => {
        mems.push({ uid: doc.id, ...doc.data() } as Member);
      });
      setMembers(mems);
    });

    return () => {
      unsubBalance();
      unsubTransactions();
      unsubExpenses();
      unsubMembers();
    };
  }, []);

  const updateClubBalance = async (amount: number) => {
    const balanceRef = doc(db, 'settings', 'clubBalance');
    const balanceDoc = await getDoc(balanceRef);
    
    if (balanceDoc.exists()) {
      await updateDoc(balanceRef, {
        currentBalance: (balanceDoc.data().currentBalance || 0) + amount,
        lastUpdated: Timestamp.now(),
        updatedBy: currentUser?.uid,
      });
    } else {
      await setDoc(balanceRef, {
        currentBalance: amount,
        lastUpdated: Timestamp.now(),
        updatedBy: currentUser?.uid,
      });
    }
  };

  const handleAddMoney = async () => {
    if (!addMoneyAmount || !addMoneyReason) {
      setError('Please fill in all fields');
      return;
    }

    const amount = parseFloat(addMoneyAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }

    try {
      // Add transaction record
      await addDoc(collection(db, 'clubTransactions'), {
        type: 'manual_add' as ClubTransactionType,
        amount: amount,
        description: addMoneyReason,
        createdBy: currentUser?.uid,
        createdByName: currentUser?.displayName || currentUser?.email,
        createdAt: Timestamp.now(),
      });

      // Update balance
      await updateClubBalance(amount);

      setSuccess('Money added successfully');
      setAddMoneyOpen(false);
      setAddMoneyAmount('');
      setAddMoneyReason('');
    } catch (err: any) {
      setError(err.message || 'Failed to add money');
    }
  };

  const handlePayExpense = async () => {
    if (!expenseVendor || !expenseDescription || !expenseAmount) {
      setError('Please fill in all fields');
      return;
    }

    const amount = parseFloat(expenseAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }

    try {
      // Add expense record
      const expenseRef = await addDoc(collection(db, 'clubExpenses'), {
        vendor: expenseVendor,
        description: expenseDescription,
        amount: amount,
        status: 'paid',
        paidAt: Timestamp.now(),
        createdBy: currentUser?.uid,
        createdAt: Timestamp.now(),
      });

      // Add transaction record (negative amount)
      await addDoc(collection(db, 'clubTransactions'), {
        type: 'invoice_payment' as ClubTransactionType,
        amount: -amount,
        description: `Payment to ${expenseVendor}: ${expenseDescription}`,
        createdBy: currentUser?.uid,
        createdByName: currentUser?.displayName || currentUser?.email,
        createdAt: Timestamp.now(),
      });

      // Update balance
      await updateClubBalance(-amount);

      setSuccess('Expense paid successfully');
      setPayExpenseOpen(false);
      setExpenseVendor('');
      setExpenseDescription('');
      setExpenseAmount('');
    } catch (err: any) {
      setError(err.message || 'Failed to pay expense');
    }
  };

  const handleRefund = async () => {
    if (!refundMember || !refundAmount || !refundReason) {
      setError('Please fill in all fields');
      return;
    }

    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        // ============ ALL READS FIRST ============
        const balanceRef = doc(db, 'settings', 'clubBalance');
        const balanceDoc = await transaction.get(balanceRef);
        const currentBalance = balanceDoc.exists() ? balanceDoc.data().currentBalance || 0 : 0;

        let memberBalance = 0;
        const memberRef = doc(db, 'members', refundMember.uid);
        if (refundToMemberBalance) {
          const memberDoc = await transaction.get(memberRef);
          memberBalance = memberDoc.exists() ? memberDoc.data().balance || 0 : 0;
        }

        // ============ ALL WRITES AFTER ============
        // Add club transaction record (negative amount)
        const clubTxnRef = doc(collection(db, 'clubTransactions'));
        transaction.set(clubTxnRef, {
          type: 'refund' as ClubTransactionType,
          amount: -amount,
          description: `Refund to ${refundMember.name}: ${refundReason}`,
          memberId: refundMember.uid,
          memberName: refundMember.name,
          createdBy: currentUser?.uid,
          createdByName: currentUser?.displayName || currentUser?.email,
          createdAt: Timestamp.now(),
        });

        // Update club balance
        transaction.set(balanceRef, {
          currentBalance: currentBalance - amount,
          lastUpdated: Timestamp.now(),
          updatedBy: currentUser?.uid,
        }, { merge: true });

        // If refund to member balance, update member's balance
        if (refundToMemberBalance) {
          transaction.update(memberRef, {
            balance: memberBalance + amount,
          });

          // Add member transaction record
          const memberTxnRef = doc(collection(db, 'memberTransactions'));
          transaction.set(memberTxnRef, {
            memberId: refundMember.uid,
            type: 'refund',
            amount: amount,
            description: refundReason,
            adminId: currentUser?.uid,
            adminName: currentUser?.displayName || currentUser?.email,
            createdAt: Timestamp.now(),
          });
        }
      });

      setSuccess(`Refund of €${amount.toFixed(2)} processed${refundToMemberBalance ? ' and added to member balance' : ''}`);
      setRefundOpen(false);
      setRefundMember(null);
      setRefundAmount('');
      setRefundReason('');
      setRefundToMemberBalance(true);
    } catch (err: any) {
      setError(err.message || 'Failed to process refund');
    }
  };

  const handleAddToMemberBalance = async () => {
    if (!selectedMember || !memberAddAmount || !memberAddReason) {
      setError('Please fill in all fields');
      return;
    }

    const amount = parseFloat(memberAddAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        // ============ ALL READS FIRST ============
        const memberRef = doc(db, 'members', selectedMember.uid);
        const memberDoc = await transaction.get(memberRef);
        const currentBalance = memberDoc.exists() ? memberDoc.data().balance || 0 : 0;

        // ============ ALL WRITES AFTER ============
        // Update member's balance
        transaction.update(memberRef, {
          balance: currentBalance + amount,
        });

        // Add member transaction record
        const memberTxnRef = doc(collection(db, 'memberTransactions'));
        transaction.set(memberTxnRef, {
          memberId: selectedMember.uid,
          type: 'admin_adjustment',
          amount: amount,
          description: memberAddReason,
          adminId: currentUser?.uid,
          adminName: currentUser?.displayName || currentUser?.email,
          createdAt: Timestamp.now(),
        });
      });

      setSuccess(`€${amount.toFixed(2)} added to ${selectedMember.name}'s balance`);
      setAddToMemberOpen(false);
      setSelectedMember(null);
      setMemberAddAmount('');
      setMemberAddReason('');
    } catch (err: any) {
      setError(err.message || 'Failed to add to member balance');
    }
  };

  const getTransactionTypeLabel = (type: ClubTransactionType) => {
    switch (type) {
      case 'session_payment': return 'Session Payment';
      case 'refund': return 'Refund';
      case 'manual_add': return 'Manual Addition';
      case 'invoice_payment': return 'Invoice/Expense';
      case 'member_topup': return 'Member Top-up';
      default: return type;
    }
  };

  const getTransactionColor = (type: ClubTransactionType) => {
    switch (type) {
      case 'session_payment':
      case 'manual_add':
      case 'member_topup':
        return 'success';
      case 'refund':
      case 'invoice_payment':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Club Finance
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

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountBalance />
                <Typography variant="h6">Club Balance</Typography>
              </Box>
              <Typography variant="h3" sx={{ mt: 1 }}>
                €{clubBalance.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp />
                <Typography variant="h6">Total Income</Typography>
              </Box>
              <Typography variant="h3" sx={{ mt: 1 }}>
                €{totalIncome.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'error.main', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingDown />
                <Typography variant="h6">Total Expenses</Typography>
              </Box>
              <Typography variant="h3" sx={{ mt: 1 }}>
                €{totalExpenses.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item>
            <Button
              variant="contained"
              color="success"
              startIcon={<Add />}
              onClick={() => setAddMoneyOpen(true)}
            >
              Add Money
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="error"
              startIcon={<Payment />}
              onClick={() => setPayExpenseOpen(true)}
            >
              Pay Expense
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="warning"
              startIcon={<Refresh />}
              onClick={() => setRefundOpen(true)}
            >
              Issue Refund
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="info"
              startIcon={<PersonAdd />}
              onClick={() => setAddToMemberOpen(true)}
            >
              Add to Member Balance
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="All Transactions" />
          <Tab label="Member Balances" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Member</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Created By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No transactions yet
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell>{formatDate(txn.createdAt)}</TableCell>
                      <TableCell>
                        <Chip
                          label={getTransactionTypeLabel(txn.type)}
                          color={getTransactionColor(txn.type) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{txn.description}</TableCell>
                      <TableCell>{txn.memberName || '-'}</TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color: txn.amount >= 0 ? 'success.main' : 'error.main',
                          fontWeight: 'bold',
                        }}
                      >
                        {txn.amount >= 0 ? '+' : ''}€{txn.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>{txn.createdByName}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Member</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Long-term Member</TableCell>
                  <TableCell align="right">Balance</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members
                  .filter(m => (m.balance && m.balance > 0) || m.isLongTermMember)
                  .map((member) => (
                    <TableRow key={member.uid}>
                      <TableCell>{member.name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        {member.isLongTermMember ? (
                          <Chip label="Long-term" color="primary" size="small" />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontWeight: 'bold', color: 'success.main' }}
                      >
                        €{(member.balance || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => {
                            setSelectedMember(member);
                            setAddToMemberOpen(true);
                          }}
                        >
                          Add Credit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                {members.filter(m => (m.balance && m.balance > 0) || m.isLongTermMember).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No members with balance or long-term status
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Add Money Dialog */}
      <Dialog open={addMoneyOpen} onClose={() => setAddMoneyOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Money to Club Balance</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Amount (€)"
            type="number"
            fullWidth
            value={addMoneyAmount}
            onChange={(e) => setAddMoneyAmount(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">€</InputAdornment>,
            }}
          />
          <TextField
            margin="dense"
            label="Reason / Description"
            fullWidth
            multiline
            rows={2}
            value={addMoneyReason}
            onChange={(e) => setAddMoneyReason(e.target.value)}
            placeholder="e.g., Donation from sponsor, Cash deposit, etc."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddMoneyOpen(false)}>Cancel</Button>
          <Button onClick={handleAddMoney} variant="contained" color="success">
            Add Money
          </Button>
        </DialogActions>
      </Dialog>

      {/* Pay Expense Dialog */}
      <Dialog open={payExpenseOpen} onClose={() => setPayExpenseOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Pay Expense / Invoice</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Vendor / Payee"
            fullWidth
            value={expenseVendor}
            onChange={(e) => setExpenseVendor(e.target.value)}
            placeholder="e.g., Pool rental, Equipment supplier"
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={expenseDescription}
            onChange={(e) => setExpenseDescription(e.target.value)}
            placeholder="e.g., Pool rental December 2024, Invoice #12345"
          />
          <TextField
            margin="dense"
            label="Amount (€)"
            type="number"
            fullWidth
            value={expenseAmount}
            onChange={(e) => setExpenseAmount(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">€</InputAdornment>,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayExpenseOpen(false)}>Cancel</Button>
          <Button onClick={handlePayExpense} variant="contained" color="error">
            Pay Expense
          </Button>
        </DialogActions>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={refundOpen} onClose={() => setRefundOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Issue Refund</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={members}
            getOptionLabel={(option) => `${option.name} (${option.email})`}
            value={refundMember}
            onChange={(_, value) => setRefundMember(value)}
            renderInput={(params) => (
              <TextField {...params} label="Select Member" margin="dense" />
            )}
            sx={{ mt: 1 }}
          />
          <TextField
            margin="dense"
            label="Amount (€)"
            type="number"
            fullWidth
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">€</InputAdornment>,
            }}
          />
          <TextField
            margin="dense"
            label="Reason for Refund"
            fullWidth
            multiline
            rows={2}
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            placeholder="e.g., Session cancelled, Duplicate payment"
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Refund To</InputLabel>
            <Select
              value={refundToMemberBalance ? 'balance' : 'external'}
              onChange={(e) => setRefundToMemberBalance(e.target.value === 'balance')}
              label="Refund To"
            >
              <MenuItem value="balance">Add to Member's Balance</MenuItem>
              <MenuItem value="external">External Refund (bank transfer)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundOpen(false)}>Cancel</Button>
          <Button onClick={handleRefund} variant="contained" color="warning">
            Issue Refund
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add to Member Balance Dialog */}
      <Dialog open={addToMemberOpen} onClose={() => setAddToMemberOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add to Member Balance</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={members}
            getOptionLabel={(option) => `${option.name} (${option.email})`}
            value={selectedMember}
            onChange={(_, value) => setSelectedMember(value)}
            renderInput={(params) => (
              <TextField {...params} label="Select Member" margin="dense" />
            )}
            sx={{ mt: 1 }}
          />
          {selectedMember && (
            <Alert severity="info" sx={{ mt: 1 }}>
              Current balance: €{(selectedMember.balance || 0).toFixed(2)}
            </Alert>
          )}
          <TextField
            margin="dense"
            label="Amount to Add (€)"
            type="number"
            fullWidth
            value={memberAddAmount}
            onChange={(e) => setMemberAddAmount(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">€</InputAdornment>,
            }}
          />
          <TextField
            margin="dense"
            label="Reason"
            fullWidth
            multiline
            rows={2}
            value={memberAddReason}
            onChange={(e) => setMemberAddReason(e.target.value)}
            placeholder="e.g., Prepaid credit purchase, Compensation"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddToMemberOpen(false)}>Cancel</Button>
          <Button onClick={handleAddToMemberBalance} variant="contained" color="info">
            Add to Balance
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClubFinance;
