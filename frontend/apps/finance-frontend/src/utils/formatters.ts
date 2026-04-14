// Formatter utilities for Finance module

/**
 * Format number as currency (IDR)
 */
export const formatCurrency = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return 'Rp 0';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return 'Rp 0';
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numValue);
};

/**
 * Format date to readable format
 */
export const formatDate = (date: string | Date | null | undefined, format: 'short' | 'long' = 'short'): string => {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '-';
  
  if (format === 'long') {
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(dateObj);
  }
  
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
};

/**
 * Format number with thousand separators
 */
export const formatNumber = (value: number | string | null | undefined, decimals: number = 2): string => {
  if (value === null || value === undefined || value === '') return '0';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0';
  
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue);
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '0%';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0%';
  
  return `${formatNumber(numValue, 2)}%`;
};

/**
 * Parse currency string to number
 */
export const parseCurrency = (value: string): number => {
  if (!value) return 0;
  
  // Remove currency symbol and separators
  const cleaned = value.replace(/[Rp\s.]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
};
