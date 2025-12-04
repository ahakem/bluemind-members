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
  IconButton,
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
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Invoice } from '../../types';
import { format } from 'date-fns';

const PaymentVerification: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [confirmDialog, setConfirmDialog] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const invoicesQuery = query(
        collection(db, 'invoices'),
        where('status', 'in', ['pending', 'transfer_initiated'])
      );
      const querySnapshot = await getDocs(invoicesQuery);
      const invoicesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data().dueDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        transferInitiatedAt: doc.data().transferInitiatedAt?.toDate(),
      })) as Invoice[];
      setInvoices(invoicesList);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedInvoice) return;

    try {
      // Update invoice status
      await updateDoc(doc(db, 'invoices', selectedInvoice.id), {
        status: 'paid',
        paidAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Update member's subscription status
      await updateDoc(doc(db, 'members', selectedInvoice.memberId), {
        membershipStatus: 'active',
        membershipExpiry: Timestamp.fromDate(
          new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        ),
        updatedAt: Timestamp.now(),
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
    { field: 'memberName', headerName: 'Member', width: 200 },
    { field: 'memberEmail', headerName: 'Email', width: 250 },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 120,
      renderCell: (params: GridRenderCellParams) => `€${params.value}`,
    },
    {
      field: 'uniquePaymentReference',
      headerName: 'Payment Reference',
      width: 180,
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
      width: 150,
      renderCell: (params: GridRenderCellParams) => {
        const status = params.value as string;
        const color =
          status === 'transfer_initiated' ? 'warning' : status === 'pending' ? 'default' : 'success';
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
      field: 'dueDate',
      headerName: 'Due Date',
      width: 130,
      renderCell: (params: GridRenderCellParams) =>
        params.value ? format(params.value as Date, 'MMM d, yyyy') : '-',
    },
    {
      field: 'transferInitiatedAt',
      headerName: 'Transfer Initiated',
      width: 150,
      renderCell: (params: GridRenderCellParams) =>
        params.value ? format(params.value as Date, 'MMM d, yyyy') : '-',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
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

  const transferInitiatedCount = invoices.filter(
    inv => inv.status === 'transfer_initiated'
  ).length;

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

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={invoices}
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
              <Alert severity="warning" sx={{ mt: 2 }}>
                This will mark the invoice as paid and activate the member's subscription for 1 year.
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
