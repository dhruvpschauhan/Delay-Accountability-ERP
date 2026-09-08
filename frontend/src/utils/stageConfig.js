import {
  EditNote, LocalShipping, Search, HourglassEmpty,
  SwapHoriz, ReceiptLong, CheckCircle, Payment,
  AssignmentTurnedIn, Loop
} from '@mui/icons-material';

export const STAGES = {
  invoice_entry: {
    label: 'Invoice Entry',
    shortLabel: 'Entry',
    color: '#5c6bc0',
    bgColor: '#e8eaf6',
    owner: 'store_officer',
    delayType: 'internal',
    icon: EditNote,
    description: 'Store Officer is entering PO and invoice details',
  },
  material_receipt: {
    label: 'Material Receipt',
    shortLabel: 'Receipt',
    color: '#7b1fa2',
    bgColor: '#f3e5f5',
    owner: 'store_officer',
    delayType: 'internal',
    icon: LocalShipping,
    description: 'Store Officer recording material received',
  },
  inspection_summary: {
    label: 'Inspection',
    shortLabel: 'Inspection',
    color: '#1565c0',
    bgColor: '#e3f2fd',
    owner: 'store_officer',
    delayType: 'internal',
    icon: Search,
    description: 'Store Officer confirming quality inspection',
  },
  partial_firm_intimation: {
    label: 'Awaiting Firm',
    shortLabel: 'Firm Wait',
    color: '#e65100',
    bgColor: '#fbe9e7',
    owner: 'external',
    delayType: 'external_wait',
    icon: HourglassEmpty,
    description: 'Waiting for supplier to confirm replacement',
  },
  forwarded_to_accounts: {
    label: 'Forwarded to Accounts',
    shortLabel: 'Forwarded',
    color: '#00796b',
    bgColor: '#e0f2f1',
    owner: 'accounts_officer',
    delayType: 'handoff',
    icon: SwapHoriz,
    description: 'Invoice passed to Accounts for verification',
  },
  accounts_verification: {
    label: 'Accounts Verification',
    shortLabel: 'Verifying',
    color: '#1a3a5c',
    bgColor: '#e8edf5',
    owner: 'accounts_officer',
    delayType: 'internal',
    icon: ReceiptLong,
    description: 'Accounts Officer reviewing invoice details',
  },
  observation_correspondence: {
    label: 'Observation Raised',
    shortLabel: 'Observation',
    color: '#c0392b',
    bgColor: '#fdecea',
    owner: 'external',
    delayType: 'external_wait',
    icon: Loop,
    description: 'Waiting for firm/purchaser to address observations',
  },
  invoice_passed: {
    label: 'Invoice Passed',
    shortLabel: 'Passed',
    color: '#1e7e34',
    bgColor: '#e8f5e9',
    owner: 'accounts_officer',
    delayType: 'internal',
    icon: CheckCircle,
    description: 'Invoice approved and ready for payment',
  },
  payment_recorded: {
    label: 'Payment Recorded',
    shortLabel: 'Paid',
    color: '#004d40',
    bgColor: '#e0f2f1',
    owner: 'accounts_officer',
    delayType: 'internal',
    icon: Payment,
    description: 'Payment released and recorded',
  },
  replacement_processing: {
    label: 'Replacement Processing',
    shortLabel: 'Rep Process',
    color: '#7b1fa2',
    bgColor: '#f3e5f5',
    owner: 'store_officer',
    delayType: 'internal',
    icon: Loop,
    description: 'Store Officer processing replaced material',
  },
};

export const getStageConfig = (stageName) =>
  STAGES[stageName] ?? {
    label: stageName,
    color: '#9e9e9e',
    bgColor: '#f5f5f5',
    icon: AssignmentTurnedIn,
    description: 'Unknown stage',
  };

export const STORE_STAGES = ['invoice_entry', 'material_receipt', 'inspection_summary', 'partial_firm_intimation', 'replacement_processing', 'forwarded_to_accounts'];
export const ACCOUNTS_STAGES = ['accounts_verification', 'invoice_passed', 'payment_recorded'];
export const EXTERNAL_STAGES = ['observation_correspondence'];
