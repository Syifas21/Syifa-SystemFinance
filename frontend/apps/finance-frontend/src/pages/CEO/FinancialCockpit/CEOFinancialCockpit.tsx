import React, { useState } from 'react';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ScaleIcon,
  BanknotesIcon,
  CalendarIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';
import TaxRatesTabCEO from './TaxRatesTabCEO';
import ExchangeRatesTab from '../../FinancialCockpit/ExchangeRatesTab';
import DiscountPoliciesTabCEO from './DiscountPoliciesTabCEO';
import MarginPoliciesTab from '../../FinancialCockpit/MarginPoliciesTab';
import PaymentTermsTab from '../../FinancialCockpit/PaymentTermsTab';
import InvoiceMilestonesTab from '../../FinancialCockpit/InvoiceMilestonesTab';

type TabKey = 'taxRates' | 'exchangeRates' | 'discountPolicies' | 'marginPolicies' | 'paymentTerms' | 'invoiceMilestones';

interface Tab {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  description: string;
}

const CEOFinancialCockpit: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('taxRates');

  // CEO theme colors - Brown/Orange
  const ceoTheme = {
    primary: '#7C2D12',      // brown-900
    secondary: '#92400E',    // brown-800
    accent: '#D97706',       // amber-600
    light: '#FEF3C7',        // amber-50
    border: '#F59E0B',       // amber-500
  };

  const tabs: Tab[] = [
    {
      key: 'taxRates',
      label: 'Tarif Pajak',
      icon: ChartBarIcon,
      badge: 5,
      description: 'Kelola tarif pajak (PPN, PPh, dll)',
    },
    {
      key: 'exchangeRates',
      label: 'Kurs Mata Uang',
      icon: CurrencyDollarIcon,
      badge: 8,
      description: 'Kelola kurs mata uang asing',
    },
    {
      key: 'discountPolicies',
      label: 'Kebijakan Diskon',
      icon: ScaleIcon,
      description: 'Kelola kebijakan diskon per peran',
    },
    {
      key: 'marginPolicies',
      label: 'Kebijakan Margin',
      icon: BanknotesIcon,
      badge: 21,
      description: 'TDD-014: Kelola kebijakan margin kotor 2025-2026 (26-65%)',
    },
    {
      key: 'paymentTerms',
      label: 'Termin Pembayaran',
      icon: CalendarIcon,
      badge: 4,
      description: 'Kelola TOP (Terms of Payment)',
    },
    {
      key: 'invoiceMilestones',
      label: 'Pencapaian Invoice',
      icon: DocumentChartBarIcon,
      description: 'TDD-016: Auto-invoice dari pencapaian proyek (30%, 70%, Serah Terima)',
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'taxRates':
        return <TaxRatesTabCEO />;
      case 'exchangeRates':
        return <ExchangeRatesTab />;
      case 'discountPolicies':
        return <DiscountPoliciesTabCEO />;
      case 'marginPolicies':
        return <MarginPoliciesTab />;
      case 'paymentTerms':
        return <PaymentTermsTab />;
      case 'invoiceMilestones':
        return <InvoiceMilestonesTab />;
      default:
        return <TaxRatesTabCEO />;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FEF3C7' }}>
      {/* CEO Header */}
      <div 
        className="px-6 py-8 shadow-lg"
        style={{ 
          background: `linear-gradient(135deg, ${ceoTheme.primary} 0%, ${ceoTheme.secondary} 100%)` 
        }}
      >
        <div className="flex items-center gap-4 mb-4">
          <div 
            className="p-4 rounded-xl shadow-md"
            style={{ backgroundColor: ceoTheme.accent }}
          >
            <ChartBarIcon className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">💡 Kokpit Finansial CEO</h1>
            <p className="text-amber-100 mt-1">
              Pusat kontrol untuk mengelola 6 kebijakan finansial utama perusahaan
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  relative p-4 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'shadow-xl transform scale-105' 
                    : 'hover:shadow-lg hover:scale-102'
                  }
                `}
                style={{
                  backgroundColor: isActive ? 'white' : ceoTheme.light,
                  borderLeft: isActive ? `4px solid ${ceoTheme.accent}` : 'none',
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <Icon 
                    className="h-6 w-6" 
                    style={{ color: isActive ? ceoTheme.primary : ceoTheme.secondary }}
                  />
                  <span 
                    className={`text-sm font-semibold text-center ${
                      isActive ? 'text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </span>
                  {tab.badge !== undefined && (
                    <span 
                      className="absolute -top-2 -right-2 px-2 py-1 text-xs font-bold text-white rounded-full shadow-md"
                      style={{ backgroundColor: ceoTheme.accent }}
                    >
                      {tab.badge}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                      <div 
                        className="w-3 h-3 rotate-45"
                        style={{ backgroundColor: 'white' }}
                      />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Description Banner */}
      <div 
        className="px-6 py-4 shadow-sm"
        style={{ 
          backgroundColor: ceoTheme.light,
          borderBottom: `2px solid ${ceoTheme.border}` 
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-1 h-12 rounded-full"
            style={{ backgroundColor: ceoTheme.accent }}
          />
          <div>
            <h2 className="text-xl font-bold" style={{ color: ceoTheme.primary }}>
              {tabs.find(t => t.key === activeTab)?.label}
            </h2>
            <p className="text-gray-700 text-sm mt-1">
              {tabs.find(t => t.key === activeTab)?.description}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6 py-6">
        <div 
          className="bg-white rounded-xl shadow-lg p-6"
          style={{ borderTop: `4px solid ${ceoTheme.accent}` }}
        >
          {renderTabContent()}
        </div>
      </div>

      {/* CEO Footer Info */}
      <div className="px-6 py-4 text-center text-sm text-gray-600">
        <p>
          💼 <strong>CEO View:</strong> Setiap kebijakan memiliki status dan memerlukan persetujuan untuk perubahan kritis
        </p>
      </div>
    </div>
  );
};

export default CEOFinancialCockpit;
