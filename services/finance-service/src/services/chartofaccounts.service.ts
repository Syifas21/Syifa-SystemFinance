import { prisma } from '../utils/prisma';

export const getAllChartOfAccounts = async () => {
  const accounts = await prisma.chartOfAccounts.findMany({
    orderBy: { id: 'asc' },
  });
  return accounts;
};
