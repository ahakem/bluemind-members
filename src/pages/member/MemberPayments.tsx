import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Divider,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  IconButton,
} from '@mui/material';
import { ContentCopy, CheckCircle } from '@mui/icons-material';
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
import { useAuth } from '../../contexts/AuthContext';
import { Invoice, PaymentInfo } from '../../types';
import { format } from 'date-fns';

const MemberPayments: React.FC = () => {
  const { currentUser } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  // Payment information - this should be stored in Firestore or environment variables
  const paymentInfo: PaymentInfo = {
    iban: 'NL91ABNA0417164300',
    bankName: 'ABN AMRO',
    accountHolder: 'BlueMind Freediving',
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    if (!currentUser) return;

    try {
      const invoicesQuery = query(
        collection(db, 'invoices'),
        where('memberId', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(invoicesQuery);
      const invoicesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data().dueDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        paidAt: doc.data().paidAt?.toDate(),
        transferInitiatedAt: doc.data().transferInitiatedAt?.toDate(),
      })) as Invoice[];
      setInvoices(invoicesList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const handleInitiateTransfer = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setOpenDialog(true);
  };

  const handleConfirmTransfer = async () => {
    if (!selectedInvoice) return;

    try {
      await updateDoc(doc(db, 'invoices', selectedInvoice.id), {
        status: 'transfer_initiated',
        transferInitiatedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      fetchInvoices();
      setOpenDialog(false);
      setSelectedInvoice(null);
    } catch (error) {
      console.error('Error updating invoice:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'transfer_initiated':
        return 'warning';
      case 'overdue':
        return 'error';
      default:
        return 'info';
    }
  };

  const pendingInvoice = invoices.find(inv => inv.status === 'pending');

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Payments & Invoices
      </Typography>

      {pendingInvoice && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You have a pending payment due by {format(pendingInvoice.dueDate, 'MMMM d, yyyy')}.
        </Alert>
      )}

      <Grid container spacing={3}>
        {invoices.map(invoice => (
          <Grid item xs={12} key={invoice.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {invoice.description}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Invoice Date: {format(invoice.createdAt, 'MMMM d, yyyy')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Due Date: {format(invoice.dueDate, 'MMMM d, yyyy')}
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      €{invoice.amount}
                    </Typography>
                    <Chip
                      label={invoice.status.replace('_', ' ')}
                      color={getStatusColor(invoice.status)}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Box>

                {invoice.status === 'pending' && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Button
                      variant="contained"
                      onClick={() => handleInitiateTransfer(invoice)}
                      fullWidth
                    >
                      Proceed to Payment
                    </Button>
                  </>
                )}

                {invoice.status === 'transfer_initiated' && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Transfer initiated on {format(invoice.transferInitiatedAt!, 'MMMM d, yyyy')}.
                    Awaiting admin verification.
                  </Alert>
                )}

                {invoice.status === 'paid' && (
                  <Alert severity="success" sx={{ mt: 2 }} icon={<CheckCircle />}>
                    Payment received on {format(invoice.paidAt!, 'MMMM d, yyyy')}. Thank you!
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}

        {invoices.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No invoices found.
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Manual Bank Transfer Instructions</DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                Please complete the bank transfer using the following details. After completing
                the transfer, confirm below to notify the admin.
              </Alert>

              <Paper sx={{ p: 3, bgcolor: 'background.default', mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Amount to Transfer
                </Typography>
                <Typography variant="h4" color="primary" gutterBottom fontWeight="bold">
                  €{selectedInvoice.amount}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Bank Name
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {paymentInfo.bankName}
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Account Holder
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {paymentInfo.accountHolder}
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    IBAN
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body1" fontFamily="monospace" fontWeight="bold">
                      {paymentInfo.iban}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(paymentInfo.iban)}
                    >
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Typography variant="subtitle2" color="error" gutterBottom>
                    IMPORTANT: Payment Reference
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Typography
                      variant="h6"
                      fontFamily="monospace"
                      fontWeight="bold"
                      color="error"
                    >
                      {selectedInvoice.uniquePaymentReference}
                    </Typography>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => copyToClipboard(selectedInvoice.uniquePaymentReference)}
                    >
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Box>
                  <Alert severity="warning">
                    Please include this reference in your transfer to ensure proper identification!
                  </Alert>
                </Box>
              </Paper>

              {copied && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Copied to clipboard!
                </Alert>
              )}

              <Alert severity="warning">
                By clicking "I've Completed the Transfer", you confirm that you have initiated
                the bank transfer. The admin will verify the payment and activate your membership.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleConfirmTransfer} variant="contained" color="primary">
            I've Completed the Transfer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MemberPayments;
