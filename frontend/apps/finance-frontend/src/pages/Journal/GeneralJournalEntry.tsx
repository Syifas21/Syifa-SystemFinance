import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Paper,
  Grid,
  Alert,
  Autocomplete,
  Chip,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

/**
 * FITUR 3.4.C: General Journal Entry
 * Pencatatan Transaksi Umum (Jurnal Umum)
 * 
 * For manual journal entries that don't originate from other modules:
 * - Office expenses from petty cash (air galon, ATK)
 * - Routine bill payments (electricity, internet, rent)
 * - Non-project income (bank interest)
 * - Month-end adjustments/corrections
 */

interface JournalEntryRow {
  id: string;
  account_id: string | null;
  account?: { account_code: string; account_name: string; account_type: string } | null;
  debit: number;
  credit: number;
}

interface COAOption {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
}

const GeneralJournalEntry: React.FC = () => {
  const [transactionDate, setTransactionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [entries, setEntries] = useState<JournalEntryRow[]>([
    { id: crypto.randomUUID(), account_id: null, account: null, debit: 0, credit: 0 },
    { id: crypto.randomUUID(), account_id: null, account: null, debit: 0, credit: 0 },
  ]);
  
  const [accounts, setAccounts] = useState<COAOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Load all accounts on mount
  useEffect(() => {
    loadAllAccounts();
  }, []);

  const loadAllAccounts = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/chart-of-accounts');
      const data = await response.json();
      if (data.success) {
        setAccounts(data.data);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  // Calculate totals and balance
  const totalDebit = entries.reduce((sum, entry) => sum + (parseFloat(entry.debit.toString()) || 0), 0);
  const totalCredit = entries.reduce((sum, entry) => sum + (parseFloat(entry.credit.toString()) || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  // Add new row
  const handleAddRow = () => {
    setEntries([
      ...entries,
      { id: crypto.randomUUID(), account_id: null, account: null, debit: 0, credit: 0 }
    ]);
  };

  // Remove row
  const handleRemoveRow = (id: string) => {
    if (entries.length <= 2) {
      setErrorMessage('Minimal 2 baris jurnal diperlukan');
      return;
    }
    setEntries(entries.filter(entry => entry.id !== id));
  };

  // Update account
  const handleAccountChange = (id: string, account: COAOption | null) => {
    setEntries(entries.map(entry => 
      entry.id === id 
        ? { ...entry, account_id: account?.id || null, account }
        : entry
    ));
  };

  // Update debit
  const handleDebitChange = (id: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEntries(entries.map(entry => 
      entry.id === id 
        ? { ...entry, debit: numValue, credit: 0 } // Auto-zero credit
        : entry
    ));
  };

  // Update credit
  const handleCreditChange = (id: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEntries(entries.map(entry => 
      entry.id === id 
        ? { ...entry, credit: numValue, debit: 0 } // Auto-zero debit
        : entry
    ));
  };

  // Post journal entry
  const handlePostJournal = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    // Validation
    if (!transactionDate) {
      setErrorMessage('Tanggal transaksi harus diisi');
      return;
    }

    if (!description.trim()) {
      setErrorMessage('Deskripsi transaksi harus diisi');
      return;
    }

    const validEntries = entries.filter(e => e.account_id && (e.debit > 0 || e.credit > 0));
    if (validEntries.length < 2) {
      setErrorMessage('Minimal 2 baris jurnal valid diperlukan');
      return;
    }

    if (!isBalanced) {
      setErrorMessage(`Jurnal tidak balance! Selisih: Rp ${difference.toLocaleString('id-ID')}`);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3002/api/journal-entries/general', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_date: new Date(transactionDate).toISOString(),
          description,
          entries: validEntries.map(e => ({
            account_id: e.account_id,
            debit: e.debit,
            credit: e.credit
          })),
          created_by: 'admin' // TODO: Get from session
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(`✅ Jurnal berhasil diposting! Total: Rp ${totalDebit.toLocaleString('id-ID')}`);
        
        // Reset form
        setTransactionDate(new Date().toISOString().split('T')[0]);
        setDescription('');
        setEntries([
          { id: crypto.randomUUID(), account_id: null, account: null, debit: 0, credit: 0 },
          { id: crypto.randomUUID(), account_id: null, account: null, debit: 0, credit: 0 },
        ]);
      } else {
        setErrorMessage(data.message || 'Gagal memposting jurnal');
      }
    } catch (error: any) {
      setErrorMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        📝 Jurnal Umum (General Journal Entry)
      </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Untuk mencatat transaksi manual yang tidak berasal dari modul lain
        </Typography>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
            {successMessage}
          </Alert>
        )}

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage('')}>
            {errorMessage}
          </Alert>
        )}

        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Tanggal Transaksi"
                type="date"
                inputProps={{ min: '2020-01-01' }}
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                required
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Deskripsi Transaksi"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Pembayaran listrik bulan Januari 2025"
                required
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Journal Entry Table */}
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Baris Jurnal</Typography>
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              onClick={handleAddRow}
            >
              Tambah Baris
            </Button>
          </Box>

          {entries.map((entry, index) => (
            <Box key={entry.id} sx={{ mb: 2, pb: 2, borderBottom: '1px solid #e0e0e0' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={5}>
                  <Autocomplete
                    options={accounts}
                    getOptionLabel={(option) => `${option.account_code} - ${option.account_name}`}
                    value={entry.account}
                    onChange={(_, newValue) => handleAccountChange(entry.id, newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={`Akun ${index + 1}`}
                        placeholder="Cari kode atau nama akun"
                        required
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {option.account_code}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.account_name} ({option.account_type})
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  />
                </Grid>

                <Grid item xs={5} md={3}>
                  <TextField
                    fullWidth
                    label="Debit"
                    type="number"
                    value={entry.debit || ''}
                    onChange={(e) => handleDebitChange(entry.id, e.target.value)}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>Rp</Typography>
                    }}
                  />
                </Grid>

                <Grid item xs={5} md={3}>
                  <TextField
                    fullWidth
                    label="Kredit"
                    type="number"
                    value={entry.credit || ''}
                    onChange={(e) => handleCreditChange(entry.id, e.target.value)}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>Rp</Typography>
                    }}
                  />
                </Grid>

                <Grid item xs={2} md={1}>
                  <IconButton
                    color="error"
                    onClick={() => handleRemoveRow(entry.id)}
                    disabled={entries.length <= 2}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Box>
          ))}

          <Divider sx={{ my: 2 }} />

          {/* Balance Summary */}
          <Box sx={{ bgcolor: isBalanced ? '#e8f5e9' : '#ffebee', p: 2, borderRadius: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">Total Debit</Typography>
                <Typography variant="h6" color={totalDebit > 0 ? 'primary' : 'text.secondary'}>
                  {formatCurrency(totalDebit)}
                </Typography>
              </Grid>
              
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">Total Kredit</Typography>
                <Typography variant="h6" color={totalCredit > 0 ? 'primary' : 'text.secondary'}>
                  {formatCurrency(totalCredit)}
                </Typography>
              </Grid>
              
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">Selisih</Typography>
                <Typography 
                  variant="h6" 
                  color={isBalanced ? 'success.main' : 'error.main'}
                  sx={{ fontWeight: 'bold' }}
                >
                  {formatCurrency(difference)}
                  {isBalanced && ' ✅'}
                </Typography>
              </Grid>
            </Grid>

            {!isBalanced && totalDebit > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                ⚠️ Jurnal belum balance! Debit dan Kredit harus sama.
              </Alert>
            )}
          </Box>
        </Paper>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              setTransactionDate(new Date().toISOString().split('T')[0]);
              setDescription('');
              setEntries([
                { id: crypto.randomUUID(), account_id: null, account: null, debit: 0, credit: 0 },
                { id: crypto.randomUUID(), account_id: null, account: null, debit: 0, credit: 0 },
              ]);
              setErrorMessage('');
              setSuccessMessage('');
            }}
          >
            Reset Form
          </Button>

          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handlePostJournal}
            disabled={!isBalanced || loading}
            sx={{
              bgcolor: isBalanced ? '#4caf50' : '#9e9e9e',
              '&:hover': {
                bgcolor: isBalanced ? '#45a049' : '#9e9e9e'
              }
            }}
          >
            {loading ? 'Memposting...' : 'Posting Jurnal'}
          </Button>
        </Box>

        {/* Help Text */}
      {/* Help Text */}
      <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom fontWeight="bold">
          💡 Petunjuk Penggunaan:
        </Typography>
        <Typography variant="body2" component="div">
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>Minimal 2 baris jurnal diperlukan (1 debit, 1 kredit)</li>
            <li>Total Debit harus sama dengan Total Kredit</li>
            <li>Setiap baris hanya boleh diisi Debit ATAU Kredit, tidak boleh keduanya</li>
            <li>Tombol "Posting Jurnal" hanya aktif jika jurnal sudah balance</li>
            <li>Gunakan untuk transaksi: pembayaran tagihan, pembelian ATK, penyesuaian akhir bulan, dll.</li>
          </ul>
        </Typography>
      </Box>
    </Box>
  );
};

export default GeneralJournalEntry;
