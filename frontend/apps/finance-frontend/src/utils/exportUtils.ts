import { ChartOfAccount } from '../api';

export const exportToCSV = (data: ChartOfAccount[], filename: string = 'chart-of-accounts.csv') => {
  // Define headers
  const headers = ['ID', 'Account Code', 'Account Name', 'Account Type', 'Description', 'Created At', 'Updated At'];
  
  // Convert data to CSV format
  const csvContent = [
    headers.join(','),
    ...data.map(account => [
      account.id,
      `"${account.account_code}"`,
      `"${account.account_name}"`,
      account.account_type,
      `"${account.description || ''}"`,
      new Date(account.created_at).toLocaleDateString(),
      new Date(account.updated_at).toLocaleDateString(),
    ].join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = (data: ChartOfAccount[], filename: string = 'chart-of-accounts.json') => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
