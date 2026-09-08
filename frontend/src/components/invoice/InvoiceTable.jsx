import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, MenuItem, Stack, Button, Box, Typography, Chip,
  Skeleton,
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
import InvoiceStatusChip from './InvoiceStatusChip';
import { formatCurrency, liveDurationDays } from '../../utils/formatters';
import { STAGES } from '../../utils/stageConfig';

export default function InvoiceTable({ invoices, loading, basePath }) {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!invoices) return [];
    return invoices
      .filter((inv) => {
        if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
        if (stageFilter !== 'all' && inv.current_stage !== stageFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          if (
            !inv.invoice_number?.toLowerCase().includes(q) &&
            !inv.po_number?.toLowerCase().includes(q)
          ) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Sort by days in stage descending (longest-stuck first)
        const aDays = parseFloat(liveDurationDays(a.current_stage_entered_at));
        const bDays = parseFloat(liveDurationDays(b.current_stage_entered_at));
        return bDays - aDays;
      });
  }, [invoices, statusFilter, stageFilter, search]);

  if (loading) {
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {['Invoice #', 'PO Number', 'Stage', 'Days in Stage', 'Amount', 'Status', ''].map((h) => (
                <TableCell key={h}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {[...Array(7)].map((__, j) => (
                  <TableCell key={j}><Skeleton /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  return (
    <Box>
      {/* Filters */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search invoice or PO..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 220 }}
        />
        <TextField
          select size="small" label="Status" value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="closed">Closed</MenuItem>
        </TextField>
        <TextField
          select size="small" label="Stage" value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="all">All Stages</MenuItem>
          {Object.entries(STAGES).map(([key, cfg]) => (
            <MenuItem key={key} value={key}>{cfg.label}</MenuItem>
          ))}
        </TextField>
      </Stack>

      {filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No invoices found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {invoices?.length > 0
              ? 'Try adjusting your filters.'
              : 'Create your first invoice to get started.'}
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Invoice #</TableCell>
                <TableCell>PO Number</TableCell>
                <TableCell>Current Stage</TableCell>
                <TableCell align="right">Days in Stage</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((inv) => (
                <TableRow
                  key={inv.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`${basePath}/invoices/${inv.id}`)}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} color="primary">
                      {inv.invoice_number}
                    </Typography>
                  </TableCell>
                  <TableCell>{inv.po_number}</TableCell>
                  <TableCell>
                    <InvoiceStatusChip stage={inv.current_stage} />
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={parseFloat(liveDurationDays(inv.current_stage_entered_at)) > 7 ? 'secondary.main' : 'text.primary'}
                    >
                      {liveDurationDays(inv.current_stage_entered_at)}d
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{formatCurrency(inv.invoice_amount)}</TableCell>
                  <TableCell>
                    <Chip
                      label={inv.status === 'active' ? 'Active' : 'Closed'}
                      size="small"
                      color={inv.status === 'active' ? 'primary' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Button size="small" startIcon={<Visibility />} onClick={(e) => { e.stopPropagation(); navigate(`${basePath}/invoices/${inv.id}`); }}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
