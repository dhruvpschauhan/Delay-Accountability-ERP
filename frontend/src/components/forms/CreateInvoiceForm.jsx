import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, CircularProgress, useMediaQuery, useTheme,
} from '@mui/material';
import { useCreateInvoice } from '../../hooks/useInvoices';

export default function CreateInvoiceForm({ open, onClose, onSuccess }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const createMutation = useCreateInvoice();

  const onSubmit = async (data) => {
    try {
      await createMutation.mutateAsync({
        ...data,
        firm_id: parseInt(data.firm_id, 10),
        invoice_amount: parseFloat(data.invoice_amount),
        item_quantity_ordered: parseInt(data.item_quantity_ordered, 10),
      });
      reset();
      onSuccess?.(`Invoice ${data.invoice_number} created successfully.`);
      onClose();
    } catch (err) {
      // Error handled by mutation state
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle>Create New Invoice</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="PO Number" size="small" placeholder="PO-2024-001"
            {...register('po_number', { required: 'PO Number is required', minLength: { value: 3, message: 'Min 3 characters' } })}
            error={!!errors.po_number} helperText={errors.po_number?.message}
          />
          <TextField
            label="PO Date" size="small" type="date" InputLabelProps={{ shrink: true }}
            {...register('po_date', { required: 'PO Date is required' })}
            error={!!errors.po_date} helperText={errors.po_date?.message}
          />
          <TextField
            label="Firm ID" size="small" type="number" placeholder="1"
            {...register('firm_id', { required: 'Firm is required', min: { value: 1, message: 'Invalid' } })}
            error={!!errors.firm_id} helperText={errors.firm_id?.message}
          />
          <TextField
            label="Invoice Number" size="small" placeholder="INV-5001"
            {...register('invoice_number', { required: 'Invoice Number is required', minLength: { value: 3, message: 'Min 3 characters' } })}
            error={!!errors.invoice_number} helperText={errors.invoice_number?.message}
          />
          <TextField
            label="Invoice Date" size="small" type="date" InputLabelProps={{ shrink: true }}
            {...register('invoice_date', { required: 'Invoice Date is required' })}
            error={!!errors.invoice_date} helperText={errors.invoice_date?.message}
          />
          <TextField
            label="Invoice Amount (₹)" size="small" type="number"
            {...register('invoice_amount', { required: 'Amount is required', min: { value: 1, message: 'Must be > 0' } })}
            error={!!errors.invoice_amount} helperText={errors.invoice_amount?.message}
          />
          <TextField
            label="Item Quantity Ordered" size="small" type="number"
            {...register('item_quantity_ordered', { required: 'Quantity is required', min: { value: 1, message: 'Must be > 0' } })}
            error={!!errors.item_quantity_ordered} helperText={errors.item_quantity_ordered?.message}
          />
          {createMutation.isError && (
            <TextField
              error disabled
              value={createMutation.error?.response?.data?.detail || 'Failed to create invoice.'}
              sx={{ '& .MuiInputBase-input': { color: 'error.main' } }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} variant="outlined">Cancel</Button>
          <Button type="submit" variant="contained" disabled={createMutation.isPending}>
            {createMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Create Invoice'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
