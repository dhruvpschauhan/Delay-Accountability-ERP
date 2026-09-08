import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  apiGetInvoices,
  apiGetInvoice,
  apiCreateInvoice,
  apiRecordReceipt,
  apiRecordReplacement,
  apiConfirmInspection,
  apiVerifyInvoice,
} from '../api/endpoints';

export const useInvoices = (filters = {}) => {
  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: () => apiGetInvoices(filters),
    staleTime: 30 * 1000,
  });
};

export const useInvoice = (id) => {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: () => apiGetInvoice(id),
    staleTime: 10 * 1000,
    enabled: !!id,
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiCreateInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

export const useRecordReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, data }) => apiRecordReceipt(invoiceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
    },
  });
};

export const useRecordReplacement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, data }) => apiRecordReplacement(invoiceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
    },
  });
};

export const useConfirmInspection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, data }) => apiConfirmInspection(invoiceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
    },
  });
};

export const useVerifyInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, data }) => apiVerifyInvoice(invoiceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
    },
  });
};
