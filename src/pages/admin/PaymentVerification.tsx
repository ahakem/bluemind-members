import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { CheckCircle } from '@mui/icons-material';
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  Timestamp,
  getDoc,
  runTransaction,
  addDoc,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Invoice } from '../../types';
import { format } from 'date-fns';

const PaymentVerification: React.FC = () => {
  const { currentUser } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const invoicesQuery = query(collection(db, 'invoices'));
      const querySnapshot = await getDocs(invoicesQuery);
      const invoicesList = querySnapshot.docs
        .filter(doc => doc.data().status !== 'cancelled')
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          dueDate: doc.data().dueDate?.toDate(),
          sessionDate: doc.data().sessionDate?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          transferInitiatedAt: doc.data().transferInitiatedAt?.toDate(),
          paidAt: doc.data().paidAt?.toDate(),
          confirmedAt: doc.data().confirmedAt?.toDate(),
        })) as Invoice[];
      setInvoices(invoicesList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedInvoice || !currentUser) return;

    try {
      const isTopUp = (selectedInvoice as any).isTopUp;
      const invoiceType = (selectedInvoice as any).type;
      const isMembershipInvoice = invoiceType === 'membership';

      await runTransaction(db, async (transaction) => {
        // ============ ALL READS FIRST ============
        const invoiceRef = doc(db, 'invoices', selectedInvoice.id);
        const clubBalanceRef = doc(db, 'settings', 'clubBalance');
        const clubBalanceDoc = await transaction.get(clubBalanceRef);
        const clubBalance = clubBalanceDoc.exists() ? clubBalanceDoc.data().currentBalance || 0 : 0;

        let currentMemberBalance = 0;
        const memberRef = doc(db, 'members', selectedInvoice.memberId);
        if (isTopUp) {
          const memberDoc = await transaction.get(memberRef);
          currentMemberBalance = memberDoc.exists() ? memberDoc.data().balance || 0 : 0;
        }

        // ============ ALL WRITES AFTER ============
        // Update invoice status
        transaction.update(invoiceRef, {
          status: 'paid',
          paidAt: Timestamp.now(),
          confirmedBy: currentUser.uid,
          confirmedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        // If this is a top-up, add to member balance
        if (isTopUp) {
          transaction.update(memberRef, {
            balance: currentMemberBalance + selectedInvoice.amount,
          });

          // Add member transaction record
          const memberTxnRef = doc(collection(db, 'memberTransactions'));
          transaction.set(memberTxnRef, {
            memberId: selectedInvoice.memberId,
            type: 'topup',
            amount: selectedInvoice.amount,
            description: `Account top-up (${selectedInvoice.uniquePaymentReference})`,
            adminId: currentUser.uid,
            adminName: currentUser.displayName || currentUser.email,
            createdAt: Timestamp.now(),
          });
        }

        // If this is a membership invoice, activate the member
        if (isMembershipInvoice) {
          transaction.update(memberRef, {
            membershipStatus: 'active',
            updatedAt: Timestamp.now(),
          });
        }

        // Add to club balance
        transaction.set(clubBalanceRef, {
          currentBalance: clubBalance + selectedInvoice.amount,
          lastUpdated: Timestamp.now(),
          updatedBy: currentUser.uid,
        }, { merge: true });

        // Add club transaction record
        const clubTxnRef = doc(collection(db, 'clubTransactions'));
        transaction.set(clubTxnRef, {
          type: isMembershipInvoice ? 'manual_add' : (isTopUp ? 'member_topup' : 'session_payment'),
          amount: selectedInvoice.amount,
          description: isMembershipInvoice 
            ? `Membership fee from ${selectedInvoice.memberName}`
            : (isTopUp 
              ? `Top-up from ${selectedInvoice.memberName}` 
              : `Session payment from ${selectedInvoice.memberName}`),
          memberId: selectedInvoice.memberId,
          memberName: selectedInvoice.memberName,
          invoiceId: selectedInvoice.id,
          createdBy: currentUser.uid,
          createdByName: currentUser.displayName || currentUser.email,
          createdAt: Timestamp.now(),
        });
      });

      fetchInvoices();
      setConfirmDialog(false);
      setSelectedInvoice(null);
    } catch (error) {
      console.error('Error confirming payment:', error);
    }
  };

  const openConfirmDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setConfirmDialog(true);
  };

  const columns: GridColDef[] = [
    { field: 'memberName', headerName: 'Member', width: 180 },
    { field: 'description', headerName: 'Description', width: 250 },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 100,
      renderCell: (params: GridRenderCellParams) => `€${params.value?.toFixed(2) || '0.00'}`,
    },
    {
      field: 'uniquePaymentReference',
      headerName: 'Payment Ref',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          fontFamily="monospace"
          fontWeight="bold"
          color="primary"
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      renderCell: (params: GridRenderCellParams) => {
        const status = params.value as string;
        let color: any = 'default';
        if (status === 'transfer_initiated') color = 'warning';
        else if (status === 'paid') color = 'success';
        else if (status === 'pending') color = 'info';
        return (
          <Chip
            label={status.replace('_', ' ')}
            color={color}
            size="small"
          />
        );
      },
    },
    {
      field: 'sessionDate',
      headerName: 'Session Date',
      width: 130,
      renderCell: (params: GridRenderCellParams) =>
        params.value ? format(params.value as Date, 'MMM d, yyyy') : '-',
    },
    {
      field: 'transferInitiatedAt',
      headerName: 'Transfer Initiated',
      width: 140,
      renderCell: (params: GridRenderCellParams) =>
        params.value ? format(params.value as Date, 'MMM d, yyyy') : '-',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 130,
      renderCell: (params: GridRenderCellParams) => {
        const invoice = params.row as Invoice;
        return invoice.status === 'transfer_initiated' ? (
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={<CheckCircle />}
            onClick={() => openConfirmDialog(invoice)}
          >
            Confirm
          </Button>
        ) : null;
      },
    },
  ];

  const pendingInvoices = invoices.filter(inv => inv.status === 'pending' || inv.status === 'transfer_initiated');
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  const transferInitiatedCount = invoices.filter(inv => inv.status === 'transfer_initiated').length;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Payment Verification
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Manual Bank Transfer Process:</strong>
        </Typography>
        <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
          <li>Members initiate a bank transfer with the provided IBAN and payment reference</li>
          <li>Members mark their invoice as "Transfer Initiated" in their panel</li>
          <li>Verify the payment in your bank account using the unique payment reference</li>
          <li>Click "Confirm Payment" to mark the invoice as paid and activate membership</li>
        </ol>
      </Alert>

      {transferInitiatedCount > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <strong>{transferInitiatedCount} payment(s)</strong> waiting for verification.
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label={`Pending (${pendingInvoices.length})`} />
          <Tab label={`Paid (${paidInvoices.length})`} />
        </Tabs>
      </Box>

      <Box sx={{ height: 500, width: '100%' }}>
        <DataGrid
          rows={tabValue === 0 ? pendingInvoices : paidInvoices}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
            sorting: {
              sortModel: [{ field: 'status', sort: 'desc' }],
            },
          }}
        />
      </Box>

      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle>Confirm Payment</DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Are you sure you want to confirm this payment?
              </Typography>
              <Box mt={2} p={2} bgcolor="background.default" borderRadius={1}>
                <Typography variant="body2">
                  <strong>Member:</strong> {selectedInvoice.memberName}
                </Typography>
                <Typography variant="body2">
                  <strong>Amount:</strong> €{selectedInvoice.amount}
                </Typography>
                <Typography variant="body2">
                  <strong>Reference:</strong>{' '}
                  <span style={{ fontFamily: 'monospace' }}>
                    {selectedInvoice.uniquePaymentReference}
                  </span>
                </Typography>
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}>
                This will mark the invoice as paid.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>Cancel</Button>
          <Button onClick={handleConfirmPayment} variant="contained" color="success">
            Confirm Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentVerification;
