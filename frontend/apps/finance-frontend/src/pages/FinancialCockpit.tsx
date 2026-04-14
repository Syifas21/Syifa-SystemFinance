import React, { useState } from 'react';
import THEME from '../config/theme';
import TaxRatesTab from './FinancialCockpit/TaxRatesTab';
import ExchangeRatesTab from './FinancialCockpit/ExchangeRatesTab';
import DiscountPoliciesTab from './FinancialCockpit/DiscountPoliciesTab';
import MarginPoliciesTab from './FinancialCockpit/MarginPoliciesTab';
import PaymentTermsTab from './FinancialCockpit/PaymentTermsTab';
import InvoiceMilestonesTab from './FinancialCockpit/InvoiceMilestonesTab';
import { 
  BanknotesIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  ReceiptPercentIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  Cog6ToothIcon,
  DocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { 
  BanknotesIcon as BanknotesIconSolid,
  CurrencyDollarIcon as CurrencyDollarIconSolid,
  ReceiptPercentIcon as ReceiptPercentIconSolid,
  CalendarDaysIcon as CalendarDaysIconSolid,
  DocumentCheckIcon as DocumentCheckIconSolid,
} from '@heroicons/react/24/solid';

type TabType = 'overview' | 'tax-rates' | 'exchange-rates' | 'discount-policies' | 'margin-policies' | 'payment-terms' | 'invoice-milestones';

const FinancialCockpit: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const policyCards = [
    {
      id: 'tax-rates' as TabType,
      name: 'Tarif Pajak',
      icon: BanknotesIcon,
      iconSolid: BanknotesIconSolid,
      description: 'Kelola tarif pajak (PPN, PPh, dll)',
      gradient: 'from-blue-500 to-cyan-600',
      bgLight: 'bg-blue-50',
      borderColor: 'border-blue-200',
      count: 5,
      status: 'Aktif',
    },
    {
      id: 'exchange-rates' as TabType,
      name: 'Kurs Mata Uang',
      icon: CurrencyDollarIcon,
      iconSolid: CurrencyDollarIconSolid,
      description: 'Kelola kurs mata uang asing',
      gradient: 'from-green-500 to-emerald-600',
      bgLight: 'bg-green-50',
      borderColor: 'border-green-200',
      count: 8,
      status: 'Update Harian',
    },
    {
      id: 'discount-policies' as TabType,
      name: 'Kebijakan Diskon',
      icon: ReceiptPercentIcon,
      iconSolid: ReceiptPercentIconSolid,
      description: 'Kelola kebijakan diskon per peran',
      gradient: 'from-orange-500 to-red-600',
      bgLight: 'bg-orange-50',
      borderColor: 'border-orange-200',
      count: 7,
      status: 'Aktif',
    },
    {
      id: 'margin-policies' as TabType,
      name: 'Kebijakan Margin',
      icon: ChartBarIcon,
      iconSolid: ChartBarIcon,
      description: 'TDD-014: Kelola kebijakan margin kotor 2025-2026 (26-65%)',
      gradient: 'from-emerald-500 to-teal-600',
      bgLight: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      count: 21,
      status: 'Aktif',
    },
    {
      id: 'payment-terms' as TabType,
      name: 'Termin Pembayaran',
      icon: CalendarDaysIcon,
      iconSolid: CalendarDaysIconSolid,
      description: 'Kelola TOP (Terms of Payment)',
      gradient: 'from-teal-500 to-cyan-600',
      bgLight: 'bg-teal-50',
      borderColor: 'border-teal-200',
      count: 4,
      status: 'Aktif',
    },
    {
      id: 'invoice-milestones' as TabType,
      name: 'Pencapaian Invoice',
      icon: DocumentCheckIcon,
      iconSolid: DocumentCheckIconSolid,
      description: 'TDD-016: Auto-invoice dari pencapaian proyek (30%, 70%, Serah Terima)',
      gradient: 'from-violet-500 to-purple-600',
      bgLight: 'bg-violet-50',
      borderColor: 'border-violet-200',
      count: 0,
      status: 'Berdasarkan Event',
    },
  ];

  return (
    <div className="space-y-6" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        {/* Header Banner - Gradient Blue */}
        <div className="rounded-2xl shadow-lg p-8 relative overflow-hidden" style={{ 
          background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
        }}>
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <Cog6ToothIcon className="w-10 h-10" style={{ color: 'white' }} />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2" style={{ color: 'white', fontFamily: 'inherit' }}>🏛️ Kokpit Kebijakan Finansial</h1>
                <p className="text-white/90 text-lg font-medium" style={{ fontFamily: 'inherit' }}>Pusat kontrol & manajemen untuk 6 kebijakan finansial perusahaan</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs px-3 py-1.5 rounded-full font-bold" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', fontFamily: 'inherit' }}>
                    TSD FITUR 3.4.F
                  </span>
                  <span className="text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1" style={{ backgroundColor: '#10B981', color: '#ffffff', fontFamily: 'inherit' }}>
                    <CheckCircleIcon className="w-3 h-3" />
                    Manajemen Kebijakan
                  </span>
                </div>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.2)', fontFamily: 'inherit' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'inherit' }}>Total Kebijakan</p>
                <p className="text-3xl font-bold" style={{ color: 'white', fontFamily: 'inherit' }}>{policyCards.length}</p>
              </div>
              <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.2)', fontFamily: 'inherit' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'inherit' }}>Status Sistem</p>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                  <p className="text-sm font-bold" style={{ color: 'white', fontFamily: 'inherit' }}>Aktif</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overview or Detailed Tab */}
        {activeTab === 'overview' ? (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-700 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-all"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white/90 mb-1">Kebijakan Aktif</p>
                    <p className="text-4xl font-bold">{policyCards.length}</p>
                    <p className="text-xs text-white/80 mt-2">Dari 6 total kebijakan</p>
                  </div>
                  <CheckCircleIcon className="w-16 h-16 text-white/30 group-hover:text-white/50 transition-all" />
                </div>
              </div>

              <div className="bg-sky-600 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-all"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white/90 mb-1">Total Aturan</p>
                    <p className="text-4xl font-bold">{policyCards.reduce((sum, card) => sum + card.count, 0)}</p>
                    <p className="text-xs text-white/80 mt-2">Kebijakan terkonfigurasi</p>
                  </div>
                  <ArrowTrendingUpIcon className="w-16 h-16 text-white/30 group-hover:text-white/50 transition-all" />
                </div>
              </div>

              <div className="bg-blue-600 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-all"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white/90 mb-1">Pembaruan Terakhir</p>
                    <p className="text-2xl font-bold">Hari Ini</p>
                    <p className="text-xs text-white/80 mt-2">20 Nov 2025, 14:30</p>
                  </div>
                  <CalendarDaysIcon className="w-16 h-16 text-white/30 group-hover:text-white/50 transition-all" />
                </div>
              </div>
            </div>

            {/* Policy Cards Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">📋 Daftar Kebijakan Finansial</h2>
                <p className="text-sm text-gray-600">Klik kartu untuk mengelola kebijakan</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {policyCards.map((card) => {
                  const IconOutline = card.icon;
                  const IconSolid = card.iconSolid;
                  
                  return (
                    <button
                      key={card.id}
                      onClick={() => setActiveTab(card.id)}
                      className="bg-white rounded-2xl p-6 text-left transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:-translate-y-1 group relative overflow-hidden"
                      style={{ border: `1px solid ${THEME.cardBorder}` }}
                    >
                      {/* Icon + Badge */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: THEME.primary }}>
                          <IconOutline className="w-8 h-8 text-white group-hover:hidden" />
                          <IconSolid className="w-8 h-8 text-white hidden group-hover:block" />
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-md" style={{ backgroundColor: THEME.primary }}>
                          {card.count} aturan
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold text-slate-800 mb-2">
                        {card.name}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                        {card.description}
                      </p>

                      {/* Status Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-lg"></div>
                          <span className="text-xs font-semibold text-slate-700">{card.status}</span>
                        </div>
                        <span className="text-xs text-gray-500 group-hover:text-gray-700 font-medium">
                          Kelola →
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="bg-blue-500 p-3 rounded-xl shadow-lg">
                  <ChartBarIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">💡 Tentang Kokpit Finansial</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Kokpit Finansial adalah pusat kontrol terpusat untuk mengelola 6 kebijakan finansial utama perusahaan. 
                    Setiap kebijakan memiliki fungsi CRUD lengkap untuk konfigurasi yang mudah: 
                    <strong> Tarif Pajak, Kurs Mata Uang, Kebijakan Diskon, Kebijakan Margin, Termin Pembayaran, dan Pencapaian Invoice</strong>. 
                    Semua perubahan akan langsung diterapkan ke sistem ERP.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Back Button */}
            <button
              onClick={() => setActiveTab('overview')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
            >
              ← Kembali ke Ikhtisar
            </button>

            {/* Tab Content */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-8 min-h-[500px]">
              {activeTab === 'tax-rates' && <TaxRatesTab />}
              {activeTab === 'exchange-rates' && <ExchangeRatesTab />}
              {activeTab === 'discount-policies' && <DiscountPoliciesTab />}
              {activeTab === 'margin-policies' && <MarginPoliciesTab />}
              {activeTab === 'payment-terms' && <PaymentTermsTab />}
              {activeTab === 'invoice-milestones' && <InvoiceMilestonesTab />}
            </div>
          </>
        )}
      </div>
  );
};

export default FinancialCockpit;
