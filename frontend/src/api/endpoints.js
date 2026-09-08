import api from './axios';

// Auth
export const apiLogin = (username, password) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  return api.post('/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
};

// Invoices
export const apiGetInvoices = (params = {}) =>
  api.get('/invoices/', { params }).then((r) => r.data);

export const apiGetInvoice = (id) =>
  api.get(`/invoices/${id}`).then((r) => r.data);

export const apiCreateInvoice = (data) =>
  api.post('/invoices/', data).then((r) => r.data);

export const apiRecordReceipt = (invoiceId, data) =>
  api.post(`/invoices/${invoiceId}/material-receipt`, data).then((r) => r.data);

export const apiRecordReplacement = (invoiceId, data) =>
  api.post(`/invoices/${invoiceId}/replacement`, data).then((r) => r.data);

export const apiConfirmInspection = (invoiceId, data) =>
  api.post(`/invoices/${invoiceId}/inspection`, data).then((r) => r.data);

export const apiVerifyInvoice = (invoiceId, data) =>
  api.post(`/invoices/${invoiceId}/verify`, data).then((r) => r.data);
