import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

/**
 * ====================================
 * SALES SIMULATION PAGE
 * ====================================
 * 
 * TSD FITUR 3.4.A: Proses Invoicing & Manajemen Piutang (AR)
 * 
 * Halaman simulasi untuk testing alur kerja penjualan:
 * - Sales Order (SO) dengan termin pembayaran
 * - Milestone proyek sebagai dasar penagihan
 * - Simulasi pembuatan invoice otomatis dari SO/milestone
 * - Monitoring status pembayaran dan piutang
 * 
 * Mock Data:
 * - 6 Sales Order dengan berbagai status dan termin
 * - 4 Project Milestone yang siap ditagih
 * - Simulasi perhitungan piutang dan DSO
 */

interface SalesOrder {
  id: string;
  so_number: string;
  customer_name: string;
  project_name: string;
  total_value: number;
  payment_terms: string;
  down_payment_percent: number;
  created_date: Date;
  status: 'DRAFT' | 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED';
  invoice_schedule: {
    term_name: string;
    percentage: number;
    amount: number;
    due_date: Date;
    status: 'PENDING' | 'DUE' | 'INVOICED' | 'PAID';
  }[];
}

interface ProjectMilestone {
  id: string;
  project_name: string;
  customer_name: string;
  milestone_name: string;
  milestone_value: number;
  completion_date: Date;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'INVOICED' | 'PAID';
  ready_to_invoice: boolean;
}

const SalesSimulation: React.FC = () => {
  const navigate = useNavigate();
  
  // Mock Sales Orders dengan termin pembayaran
  const [salesOrders] = useState<SalesOrder[]>([
    {
      id: 'SO-001',
      so_number: 'SO-2025-001',
      customer_name: 'PT. Sinar Jaya Abadi',
      project_name: 'Website E-Commerce B2B',
      total_value: 150000000,
      payment_terms: '50% DP, 30% Progress, 20% Completion',
      down_payment_percent: 50,
      created_date: new Date('2025-01-10'),
      status: 'ACTIVE',
      invoice_schedule: [
        { term_name: 'Down Payment 50%', percentage: 50, amount: 75000000, due_date: new Date('2025-01-15'), status: 'INVOICED' },
        { term_name: 'Progress 30%', percentage: 30, amount: 45000000, due_date: new Date('2025-02-15'), status: 'DUE' },
        { term_name: 'Completion 20%', percentage: 20, amount: 30000000, due_date: new Date('2025-03-15'), status: 'PENDING' },
      ],
    },
    {
      id: 'SO-002',
      so_number: 'SO-2025-002',
      customer_name: 'CV. Maju Bersama',
      project_name: 'Mobile App Delivery Service',
      total_value: 200000000,
      payment_terms: '40% DP, 40% Development, 20% Deployment',
      down_payment_percent: 40,
      created_date: new Date('2025-01-15'),
      status: 'IN_PROGRESS',
      invoice_schedule: [
        { term_name: 'Down Payment 40%', percentage: 40, amount: 80000000, due_date: new Date('2025-01-20'), status: 'PAID' },
        { term_name: 'Development 40%', percentage: 40, amount: 80000000, due_date: new Date('2025-02-20'), status: 'DUE' },
        { term_name: 'Deployment 20%', percentage: 20, amount: 40000000, due_date: new Date('2025-03-20'), status: 'PENDING' },
      ],
    },
    {
      id: 'SO-003',
      so_number: 'SO-2025-003',
      customer_name: 'PT. Digital Nusantara',
      project_name: 'ERP System Implementation',
      total_value: 500000000,
      payment_terms: '30% DP, 40% UAT, 30% Go-Live',
      down_payment_percent: 30,
      created_date: new Date('2024-12-01'),
      status: 'IN_PROGRESS',
      invoice_schedule: [
        { term_name: 'Down Payment 30%', percentage: 30, amount: 150000000, due_date: new Date('2024-12-10'), status: 'PAID' },
        { term_name: 'UAT Phase 40%', percentage: 40, amount: 200000000, due_date: new Date('2025-01-20'), status: 'INVOICED' },
        { term_name: 'Go-Live 30%', percentage: 30, amount: 150000000, due_date: new Date('2025-02-28'), status: 'PENDING' },
      ],
    },
    {
      id: 'SO-004',
      so_number: 'SO-2025-004',
      customer_name: 'Koperasi Sejahtera',
      project_name: 'Accounting Software Development',
      total_value: 85000000,
      payment_terms: '50% DP, 50% Completion',
      down_payment_percent: 50,
      created_date: new Date('2025-01-05'),
      status: 'ACTIVE',
      invoice_schedule: [
        { term_name: 'Down Payment 50%', percentage: 50, amount: 42500000, due_date: new Date('2025-01-10'), status: 'DUE' },
        { term_name: 'Completion 50%', percentage: 50, amount: 42500000, due_date: new Date('2025-02-28'), status: 'PENDING' },
      ],
    },
    {
      id: 'SO-005',
      so_number: 'SO-2025-005',
      customer_name: 'PT. Teknologi Cerdas',
      project_name: 'IoT Dashboard System',
      total_value: 120000000,
      payment_terms: '40% DP, 30% Prototype, 30% Launch',
      down_payment_percent: 40,
      created_date: new Date('2025-01-12'),
      status: 'ACTIVE',
      invoice_schedule: [
        { term_name: 'Down Payment 40%', percentage: 40, amount: 48000000, due_date: new Date('2025-01-17'), status: 'INVOICED' },
        { term_name: 'Prototype 30%', percentage: 30, amount: 36000000, due_date: new Date('2025-02-17'), status: 'PENDING' },
        { term_name: 'Launch 30%', percentage: 30, amount: 36000000, due_date: new Date('2025-03-17'), status: 'PENDING' },
      ],
    },
    {
      id: 'SO-006',
      so_number: 'SO-2025-006',
      customer_name: 'Yayasan Pendidikan Bangsa',
      project_name: 'Learning Management System (LMS)',
      total_value: 95000000,
      payment_terms: '35% DP, 35% Training, 30% Handover',
      down_payment_percent: 35,
      created_date: new Date('2024-12-20'),
      status: 'IN_PROGRESS',
      invoice_schedule: [
        { term_name: 'Down Payment 35%', percentage: 35, amount: 33250000, due_date: new Date('2024-12-27'), status: 'PAID' },
        { term_name: 'Training 35%', percentage: 35, amount: 33250000, due_date: new Date('2025-01-27'), status: 'DUE' },
        { term_name: 'Handover 30%', percentage: 30, amount: 28500000, due_date: new Date('2025-02-27'), status: 'PENDING' },
      ],
    },
  ]);

  // Mock Project Milestones yang siap ditagih
  const [milestones] = useState<ProjectMilestone[]>([
    {
      id: 'MS-001',
      project_name: 'Website E-Commerce B2B',
      customer_name: 'PT. Sinar Jaya Abadi',
      milestone_name: 'Database Design & Backend API',
      milestone_value: 45000000,
      completion_date: new Date('2025-01-25'),
      status: 'COMPLETED',
      ready_to_invoice: true,
    },
    {
      id: 'MS-002',
      project_name: 'ERP System Implementation',
      customer_name: 'PT. Digital Nusantara',
      milestone_name: 'User Acceptance Testing (UAT)',
      milestone_value: 200000000,
      completion_date: new Date('2025-01-18'),
      status: 'COMPLETED',
      ready_to_invoice: true,
    },
    {
      id: 'MS-003',
      project_name: 'Mobile App Delivery Service',
      customer_name: 'CV. Maju Bersama',
      milestone_name: 'Development Phase - Core Features',
      milestone_value: 80000000,
      completion_date: new Date('2025-01-30'),
      status: 'COMPLETED',
      ready_to_invoice: true,
    },
    {
      id: 'MS-004',
      project_name: 'IoT Dashboard System',
      customer_name: 'PT. Teknologi Cerdas',
      milestone_name: 'Prototype & Testing',
      milestone_value: 36000000,
      completion_date: new Date('2025-02-05'),
      status: 'IN_PROGRESS',
      ready_to_invoice: false,
    },
  ]);

  // Calculate AR Summary
  const calculateARSummary = () => {
    let totalReceivable = 0;
    let overdue = 0;
    const today = new Date();

    salesOrders.forEach(so => {
      so.invoice_schedule.forEach(term => {
        if (term.status === 'INVOICED') {
          totalReceivable += term.amount;
          if (new Date(term.due_date) < today) {
            overdue += term.amount;
          }
        }
      });
    });

    // Mock DSO calculation
    const avgDSO = 32;

    return { totalReceivable, overdue, avgDSO };
  };

  const arSummary = calculateARSummary();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-gray-100 text-gray-800';
      case 'DUE':
        return 'bg-accent-gold/20 text-accent-gold border border-accent-gold';
      case 'INVOICED':
        return 'bg-primary-light/20 text-primary-dark border border-primary-light';
      case 'PAID':
        return 'bg-primary-dark/10 text-primary-dark border border-primary-dark';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'bg-accent-gold/20 text-accent-gold border border-accent-gold';
      case 'COMPLETED':
        return 'bg-primary-light/20 text-primary-dark border border-primary-light';
      case 'INVOICED':
        return 'bg-primary-dark/10 text-primary-dark border border-primary-dark';
      case 'PAID':
        return 'bg-primary-dark text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-primary-dark to-primary-light rounded-3xl shadow-2xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent-gold/30 rounded-full blur-3xl"></div>
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <DocumentTextIcon className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white drop-shadow-lg">🔬 Simulasi Sales & Invoicing</h1>
            </div>
            <p className="text-white/90 text-lg font-medium drop-shadow">
              📊 Testing alur Sales Order, Milestone Project, dan Pembuatan Invoice Otomatis
            </p>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs bg-white/25 text-white px-3 py-1 rounded-full backdrop-blur-sm font-medium">
                TSD FITUR 3.4.A - Invoice & Piutang (AR)
              </span>
              <span className="text-xs bg-yellow-400/80 text-yellow-900 px-3 py-1 rounded-full backdrop-blur-sm font-bold">
                ⚠️ DATA SIMULASI
              </span>
            </div>
          </div>
          <button
            onClick={() => alert('Fitur ini akan tersedia saat integrasi dengan API backend selesai')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-dark font-bold shadow-lg hover:shadow-xl hover:bg-accent-gold hover:text-white transition-all duration-200 group"
          >
            <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
            Buat Sales Order
          </button>
        </div>
      </div>

      {/* AR Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Piutang */}
        <div className="bg-gradient-to-br from-white to-primary-light/10 rounded-2xl shadow-lg p-6 border border-primary-light hover:shadow-2xl hover:scale-105 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-light/20 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-primary-dark mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary-light rounded-full animate-pulse"></span>
                Total Piutang (Simulasi)
              </p>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {formatCurrency(arSummary.totalReceivable)}
              </p>
              <p className="text-xs text-gray-500">Dari invoice yang terbit</p>
            </div>
            <div className="bg-gradient-to-br from-primary-light to-accent-gold p-4 rounded-2xl shadow-lg group-hover:rotate-12 transition-transform duration-300">
              <CurrencyDollarIcon className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Overdue Amount */}
        <div className="bg-gradient-to-br from-white to-red-50 rounded-2xl shadow-lg p-6 border border-red-200 hover:shadow-2xl hover:scale-105 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                Jatuh Tempo (Simulasi)
              </p>
              <p className="text-3xl font-bold text-red-600 mb-1">
                {formatCurrency(arSummary.overdue)}
              </p>
              <p className="text-xs text-gray-500">Perlu follow-up segera</p>
            </div>
            <div className="bg-gradient-to-br from-red-400 to-rose-500 p-4 rounded-2xl shadow-lg group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
              <ExclamationTriangleIcon className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
        </div>

        {/* DSO */}
        <div className="bg-gradient-to-br from-white to-accent-gold/10 rounded-2xl shadow-lg p-6 border border-accent-gold hover:shadow-2xl hover:scale-105 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/20 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-primary-dark mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-accent-gold rounded-full animate-pulse"></span>
                Rata-rata Umur Piutang
              </p>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {arSummary.avgDSO} <span className="text-lg text-gray-600 font-normal">hari</span>
              </p>
              <p className="text-xs text-gray-500">DSO (Days Sales Outstanding)</p>
            </div>
            <div className="bg-gradient-to-br from-accent-gold to-primary-light p-4 rounded-2xl shadow-lg group-hover:rotate-12 transition-transform duration-300">
              <ClockIcon className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Sales Orders Section */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-primary-dark to-primary-light px-6 py-4 border-b border-primary-light/20">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <DocumentTextIcon className="w-6 h-6 text-accent-gold" />
            Sales Orders (SO) - Mock Data
          </h2>
        </div>
        <div className="p-6 space-y-4">
          {salesOrders.map((so) => (
            <div
              key={so.id}
              className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-primary-light/50 transition-all duration-200"
            >
              {/* SO Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-primary-dark mb-1">{so.so_number}</h3>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">{so.customer_name}</span> - {so.project_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Dibuat: {formatDate(so.created_date)} | Total: {formatCurrency(so.total_value)}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${so.status === 'COMPLETED' ? 'bg-primary-dark text-white' : 'bg-accent-gold/20 text-accent-gold border border-accent-gold'}`}>
                  {so.status}
                </span>
              </div>

              {/* Payment Terms */}
              <div className="bg-white rounded-lg p-3 border border-gray-200 mb-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">📋 Payment Terms:</p>
                <p className="text-sm text-gray-800 font-medium">{so.payment_terms}</p>
              </div>

              {/* Invoice Schedule */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-600">📅 Jadwal Penagihan:</p>
                {so.invoice_schedule.map((term, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200 hover:border-primary-light/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">{term.term_name}</p>
                      <p className="text-xs text-gray-500">
                        Jatuh tempo: {formatDate(term.due_date)} | {formatCurrency(term.amount)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(term.status)}`}>
                        {term.status === 'PAID' && <CheckCircleIcon className="w-3 h-3 inline mr-1" />}
                        {term.status}
                      </span>
                      {term.status === 'DUE' && (
                        <button
                          onClick={() => alert(`Sistem akan auto-generate invoice untuk:\n\n${so.so_number}\n${term.term_name}\n${formatCurrency(term.amount)}\n\nSetelah invoice dibuat, status akan berubah menjadi INVOICED dan jurnal akuntansi otomatis akan tercatat.`)}
                          className="px-3 py-1.5 bg-gradient-to-r from-primary-light to-accent-gold text-white text-xs font-semibold rounded-lg hover:from-accent-gold hover:to-primary-dark transition-all shadow-md"
                        >
                          🤖 Generate Invoice
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Project Milestones Section */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-accent-gold to-primary-light px-6 py-4 border-b border-accent-gold/20">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircleIcon className="w-6 h-6 text-white" />
            Project Milestones - Siap Ditagih
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  🎯 Milestone
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  👥 Pelanggan & Proyek
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  💰 Nilai
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  📅 Selesai
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  🏷️ Status
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  ⚡ Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {milestones.map((milestone) => (
                <tr key={milestone.id} className="hover:bg-gradient-to-r hover:from-primary-light/10 hover:to-accent-gold/10 transition-all duration-200">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-primary-dark">{milestone.milestone_name}</div>
                    <div className="text-xs text-gray-500">ID: {milestone.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{milestone.customer_name}</div>
                    <div className="text-xs text-gray-500">{milestone.project_name}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-semibold text-gray-900">{formatCurrency(milestone.milestone_value)}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm text-gray-900">{formatDate(milestone.completion_date)}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getMilestoneStatusColor(milestone.status)}`}>
                      {milestone.status === 'COMPLETED' && <CheckCircleIcon className="w-4 h-4 mr-1" />}
                      {milestone.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {milestone.ready_to_invoice ? (
                      <button
                        onClick={() => alert(`Milestone Completed! 🎉\n\nSistem akan membuat invoice untuk:\n\nMilestone: ${milestone.milestone_name}\nPelanggan: ${milestone.customer_name}\nNilai: ${formatCurrency(milestone.milestone_value)}\n\nSetelah invoice dibuat:\n✓ Status milestone → INVOICED\n✓ Jurnal akuntansi otomatis tercatat\n✓ Email invoice dikirim ke pelanggan`)}
                        className="px-3 py-1.5 bg-gradient-to-r from-accent-gold to-primary-light text-white text-xs font-semibold rounded-lg hover:from-primary-light hover:to-primary-dark transition-all shadow-md"
                      >
                        🚀 Buat Invoice
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Belum siap</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-br from-primary-light/10 to-accent-gold/10 border-2 border-primary-light/30 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="text-primary-light text-3xl">🤖</div>
          <div className="flex-1">
            <h3 className="font-bold text-primary-dark text-lg mb-2">Tentang Halaman Simulasi Ini</h3>
            <p className="text-sm text-gray-700 mb-3">
              Halaman ini mendemonstrasikan alur kerja <strong>TSD FITUR 3.4.A - Proses Invoicing & Manajemen Piutang (AR)</strong>:
            </p>
            <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
              <li><strong>Sales Order (SO):</strong> 6 mock SO dengan berbagai termin pembayaran (DP, Progress, Completion)</li>
              <li><strong>Automated Invoice Generation:</strong> Sistem mengecek termin yang jatuh tempo dan auto-generate invoice</li>
              <li><strong>Milestone-Based Billing:</strong> Invoice dibuat otomatis saat milestone proyek selesai</li>
              <li><strong>AR Monitoring:</strong> Perhitungan total piutang, overdue, dan DSO secara real-time</li>
              <li><strong>Jurnal Otomatis:</strong> Setiap invoice yang terbit akan memicu pencatatan jurnal akuntansi (Debit: Piutang, Credit: Pendapatan + PPN)</li>
            </ul>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>⚠️ Catatan:</strong> Data di halaman ini adalah simulasi untuk testing. Setelah API backend siap, data akan diambil dari database real dan semua aksi akan berfungsi penuh.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesSimulation;
