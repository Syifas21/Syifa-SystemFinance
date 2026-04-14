import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

/**
 * ====================================
 * SALES / QUOTATION PAGE
 * ====================================
 * 
 * Halaman untuk manage quotation/penawaran sales
 * Flow: Quotation → Klik "Buat Invoice" → Auto redirect ke Invoice Detail
 * dengan 4 tabs: Invoice, Faktur Pajak, Monitoring, Template
 */

interface QuotationItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Quotation {
  id: string;
  quotation_number: string;
  quotation_date: string;
  valid_until: string;
  customer_name: string;
  customer_address: string;
  customer_npwp: string;
  customer_contact: string;
  wo_po_number: string;
  items: QuotationItem[];
  subtotal: number;
  ppn_rate: number;
  ppn_amount: number;
  pph23_rate: number;
  pph23_amount: number;
  grand_total: number;
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'INVOICED';
  notes: string;
}

const SalesQuotation: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // SIMULASI DATA QUOTATION (Shell customers)
  const [quotations] = useState<Quotation[]>([
    {
      id: 'QT-001',
      quotation_number: 'QT-2025-001',
      quotation_date: '2025-11-01',
      valid_until: '2025-11-15',
      customer_name: 'PT. Shell Indonesia - Lenteng Agung 1',
      customer_address: 'Jl. Lenteng Agung Raya No. 123, Jakarta Selatan 12345',
      customer_npwp: '01.234.567.8-901.000',
      customer_contact: 'Bp. Ahmad - 0812-3456-7890',
      wo_po_number: 'WOSHELLSHELL',
      items: [
        {
          description: 'RM - Reactive Maintenance - Identify & Repair Chiller System',
          quantity: 1,
          unit_price: 200000,
          total: 200000,
        },
        {
          description: 'Material & Spare Parts for Chiller',
          quantity: 1,
          unit_price: 137120,
          total: 137120,
        }
      ],
      subtotal: 337120,
      ppn_rate: 11,
      ppn_amount: 37083,
      pph23_rate: 2,
      pph23_amount: 6742,
      grand_total: 367461,
      status: 'APPROVED',
      notes: 'Maintenance chiller untuk SPBU Shell Lenteng Agung',
    },
    {
      id: 'QT-002',
      quotation_number: 'QT-2025-002',
      quotation_date: '2025-11-05',
      valid_until: '2025-11-19',
      customer_name: 'PT. Shell Indonesia - Puspitek',
      customer_address: 'Kawasan Puspitek Serpong, Tangerang Selatan 15314',
      customer_npwp: '01.234.567.8-901.001',
      customer_contact: 'Ibu Siti - 0821-9876-5432',
      wo_po_number: 'WOSHELLPSK',
      items: [
        {
          description: 'Preventive Maintenance - AC System Inspection & Cleaning',
          quantity: 2,
          unit_price: 175000,
          total: 350000,
        }
      ],
      subtotal: 350000,
      ppn_rate: 11,
      ppn_amount: 38500,
      pph23_rate: 2,
      pph23_amount: 7000,
      grand_total: 381500,
      status: 'APPROVED',
      notes: 'PM rutin AC untuk SPBU Shell Puspitek',
    },
    {
      id: 'QT-003',
      quotation_number: 'QT-2025-003',
      quotation_date: '2025-11-10',
      valid_until: '2025-11-24',
      customer_name: 'PT. Shell Indonesia - Serang Cikupa',
      customer_address: 'Jl. Raya Serang-Jakarta KM 23, Cikupa, Tangerang 15710',
      customer_npwp: '01.234.567.8-901.002',
      customer_contact: 'Bp. Budi - 0813-2468-1357',
      wo_po_number: 'WOSHELLSRG',
      items: [
        {
          description: 'Emergency Repair - Kompressor Replacement',
          quantity: 1,
          unit_price: 450000,
          total: 450000,
        },
        {
          description: 'Kompressor Unit (2 HP)',
          quantity: 1,
          unit_price: 2500000,
          total: 2500000,
        }
      ],
      subtotal: 2950000,
      ppn_rate: 11,
      ppn_amount: 324500,
      pph23_rate: 2,
      pph23_amount: 59000,
      grand_total: 3215500,
      status: 'SENT',
      notes: 'Penggantian kompressor urgent untuk cooling system',
    },
    {
      id: 'QT-004',
      quotation_number: 'QT-2025-004',
      quotation_date: '2025-11-12',
      valid_until: '2025-11-26',
      customer_name: 'PT. Pertamina (Persero)',
      customer_address: 'Jl. Medan Merdeka Timur No. 1A, Jakarta Pusat 10110',
      customer_npwp: '01.001.737.6-092.000',
      customer_contact: 'Bp. Rudi - 0856-7890-1234',
      wo_po_number: 'WOPERTAMINA',
      items: [
        {
          description: 'Installation - New Chiller System 10 Ton',
          quantity: 1,
          unit_price: 5000000,
          total: 5000000,
        },
        {
          description: 'Chiller Unit 10 Ton - Daikin',
          quantity: 1,
          unit_price: 35000000,
          total: 35000000,
        },
        {
          description: 'Installation Material & Piping',
          quantity: 1,
          unit_price: 3000000,
          total: 3000000,
        }
      ],
      subtotal: 43000000,
      ppn_rate: 11,
      ppn_amount: 4730000,
      pph23_rate: 2,
      pph23_amount: 860000,
      grand_total: 46870000,
      status: 'APPROVED',
      notes: 'Project instalasi chiller baru untuk kantor pusat Pertamina',
    },
  ]);

  const handleCreateInvoice = (quotation: Quotation) => {
    // Navigate langsung ke Invoice Detail dengan data dari quotation
    // Data akan auto-populate di semua tabs
    navigate('/invoices/new-from-quotation', {
      state: {
        quotationData: quotation,
        autoGenerate: true,
      }
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'SENT':
        return 'bg-primary-light/20 text-primary-dark border border-primary-light';
      case 'APPROVED':
        return 'bg-primary-dark/10 text-primary-dark border border-primary-dark';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'INVOICED':
        return 'bg-accent-gold/20 text-accent-gold border border-accent-gold';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: 'Draft',
      SENT: 'Terkirim',
      APPROVED: 'Disetujui',
      REJECTED: 'Ditolak',
      INVOICED: 'Sudah Invoice',
    };
    return labels[status] || status;
  };

  const filteredQuotations = quotations.filter(q => {
    const matchesSearch = q.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         q.quotation_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-primary-dark rounded-3xl shadow-2xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent-gold/30 rounded-full blur-3xl"></div>
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <DocumentTextIcon className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white drop-shadow-lg">Sales & Quotation</h1>
            </div>
            <p className="text-white/90 text-lg font-medium drop-shadow">
              📋 Manage quotation & penawaran untuk customer
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-white/25 text-white px-3 py-1 rounded-full backdrop-blur-sm font-medium">
                Simulasi Flow: Quotation → Invoice
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate('/quotations/new')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-dark font-bold shadow-lg hover:shadow-xl hover:bg-accent-gold hover:text-white transition-all duration-200 group"
          >
            <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
            Buat Quotation Baru
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <p className="text-sm font-semibold text-primary-dark mb-2">Total Quotation</p>
          <p className="text-3xl font-bold text-gray-900">{quotations.length}</p>
          <p className="text-xs text-gray-600 mt-1">Semua penawaran</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <p className="text-sm font-semibold text-primary-dark mb-2">Disetujui</p>
          <p className="text-3xl font-bold text-primary-dark">
            {quotations.filter(q => q.status === 'APPROVED').length}
          </p>
          <p className="text-xs text-gray-600 mt-1">Siap dibuat invoice</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <p className="text-sm font-semibold text-primary-dark mb-2">Total Nilai</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(quotations.reduce((sum, q) => sum + q.grand_total, 0))}
          </p>
          <p className="text-xs text-gray-600 mt-1">Potensi revenue</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <p className="text-sm font-semibold text-primary-dark mb-2">Menunggu</p>
          <p className="text-3xl font-bold text-primary-light">
            {quotations.filter(q => q.status === 'SENT').length}
          </p>
          <p className="text-xs text-gray-600 mt-1">Menunggu approval</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🔍 Cari Quotation
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari customer atau nomor quotation..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-gold focus:border-accent-gold transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📊 Filter Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-gold focus:border-accent-gold transition-all"
            >
              <option value="">Semua Status</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Terkirim</option>
              <option value="APPROVED">Disetujui</option>
              <option value="REJECTED">Ditolak</option>
              <option value="INVOICED">Sudah Invoice</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quotation Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-primary-dark">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  No. Quotation
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  WO/PO
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                  Grand Total
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredQuotations.map((quotation) => (
                <tr
                  key={quotation.id}
                  className="hover:bg-gray-50 transition-all duration-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-primary-dark">{quotation.quotation_number}</div>
                    <div className="text-xs text-gray-500">Valid: {formatDate(quotation.valid_until)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(quotation.quotation_date)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{quotation.customer_name}</div>
                    <div className="text-xs text-gray-500">{quotation.customer_contact}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700">
                    {quotation.wo_po_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="font-bold text-lg text-gray-900">{formatCurrency(quotation.grand_total)}</div>
                    <div className="text-xs text-gray-500">Subtotal: {formatCurrency(quotation.subtotal)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(quotation.status)}`}>
                      {quotation.status === 'APPROVED' && <CheckCircleIcon className="w-4 h-4 mr-1" />}
                      {quotation.status === 'SENT' && <ClockIcon className="w-4 h-4 mr-1" />}
                      {getStatusLabel(quotation.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {quotation.status === 'APPROVED' && (
                      <button
                        onClick={() => handleCreateInvoice(quotation)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-dark text-white text-sm font-bold shadow-lg hover:shadow-xl hover:bg-primary-light/80 transition-all duration-200"
                      >
                        <DocumentTextIcon className="w-4 h-4" />
                        Buat Invoice
                      </button>
                    )}
                    {quotation.status !== 'APPROVED' && (
                      <span className="text-xs text-gray-400 italic">
                        Menunggu approval
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesQuotation;
