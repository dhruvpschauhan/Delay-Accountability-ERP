import dayjs from 'dayjs';

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

export const formatDate = (isoString) =>
  isoString ? dayjs(isoString).format('D MMM YYYY') : '—';

export const formatDateTime = (isoString) =>
  isoString ? dayjs(isoString).format('D MMM YYYY, h:mm A') : '—';

export const formatDuration = (hours) => {
  if (!hours && hours !== 0) return '—';
  if (hours > 0 && hours < 1) return '< 1 hr';
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  if (days === 0) return `${remainingHours} hrs`;
  if (remainingHours === 0) return `${days} day${days > 1 ? 's' : ''}`;
  return `${days}d ${remainingHours}h`;
};

export const liveDurationDays = (enteredAt) => {
  if (!enteredAt) return '0.0';
  const ms = Date.now() - new Date(enteredAt).getTime();
  return (ms / (1000 * 60 * 60 * 24)).toFixed(1);
};
