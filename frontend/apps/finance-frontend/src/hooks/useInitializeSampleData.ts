import { useEffect } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { useActivityStore } from '../store/activityStore';

export const useInitializeSampleData = () => {
  const { notifications, addNotification } = useNotificationStore();
  const { activities, addActivity } = useActivityStore();

  useEffect(() => {
    // Only initialize if no data exists
    if (notifications.length === 0) {
      // Notifikasi untuk CEO
      addNotification({
        type: 'approval_required',
        priority: 'urgent',
        title: 'Persetujuan Pengeluaran Besar Diperlukan',
        message: 'Robert Johnson mengajukan klaim pengeluaran EXP-2025-001 sebesar Rp 25.000.000. Perlu review segera.',
        from: {
          name: 'Robert Johnson',
          role: 'Manajer Penjualan',
        },
        actionUrl: '/approvals/expense',
        recipientRole: 'CEO',
        isRead: false,
      });

      addNotification({
        type: 'escalated',
        priority: 'high',
        title: 'Pelanggaran Margin Auto-Eskalasi',
        message: 'Pelanggaran margin PRJ-2025-001 belum direview selama 24 jam. Dieskalasi ke CEO.',
        from: {
          name: 'Sistem',
          role: 'Proses Otomatis',
        },
        actionUrl: '/approvals/margin',
        recipientRole: 'CEO',
        isRead: false,
      });

      // Notifikasi untuk FINANCE
      addNotification({
        type: 'approved',
        priority: 'high',
        title: 'CEO Menyetujui Pengeluaran',
        message: 'CEO telah menyetujui klaim pengeluaran EXP-2025-002 senilai Rp 32.000.000. Segera proses pembayaran.',
        from: {
          name: 'CEO',
          role: 'Chief Executive Officer',
        },
        actionUrl: '/approvals/expense',
        recipientRole: 'FINANCE_ADMIN',
        isRead: false,
      });

      addNotification({
        type: 'alert',
        priority: 'urgent',
        title: '⚠️ Cash Flow Warning - Butuh Perhatian!',
        message: 'Proyeksi cash flow 7 hari ke depan menunjukkan defisit Rp 150 juta. Segera review dan ambil tindakan!',
        from: {
          name: 'Sistem AI Finance',
          role: 'Predictive Analytics',
        },
        actionUrl: '/financial-cockpit',
        recipientRole: 'FINANCE_ADMIN',
        isRead: false,
      });

      addNotification({
        type: 'comment',
        priority: 'medium',
        title: 'CEO Mengomentari Laporan Anda',
        message: 'CEO berkomentar pada laporan Budget vs Actual Q1 2026: "Tolong jelaskan variance 15% di departemen Marketing"',
        from: {
          name: 'CEO',
          role: 'Chief Executive Officer',
        },
        actionUrl: '/reports',
        recipientRole: 'FINANCE_ADMIN',
        isRead: false,
      });

      // Notifikasi untuk SEMUA
      addNotification({
        type: 'alert',
        priority: 'high',
        title: '🎯 Target Revenue Bulanan Tercapai!',
        message: 'Selamat! Revenue bulan ini mencapai Rp 2.5 Miliar (125% dari target). Luar biasa!',
        from: {
          name: 'Sistem',
          role: 'Finance Analytics',
        },
        actionUrl: '/dashboard',
        recipientRole: 'ALL',
        isRead: false,
      });
    }

    if (activities.length === 0) {
      // Add sample activities
      addActivity({
        type: 'escalation',
        actor: { name: 'Sistem', role: 'Proses Otomatis' },
        action: 'mengeskalasi',
        target: 'Pelanggaran Margin PRJ-2025-001',
        details: 'Auto-eskalasi ke CEO setelah 24 jam tanpa review Finance. Margin: 22.5% vs 26% yang dibutuhkan.',
        metadata: {
          amount: 450000000,
          impactScore: 7.2,
          tags: ['margin', 'eskalasi', 'urgent'],
        },
      });

      addActivity({
        type: 'approval',
        actor: { name: 'CEO', role: 'Chief Executive Officer' },
        action: 'menyetujui',
        target: 'Pengeluaran Operasional OP-2026-045',
        details: 'Menyetujui pengeluaran Rp 85.000.000 untuk renovasi kantor cabang Surabaya. Proses pembayaran dapat dilanjutkan.',
        metadata: {
          amount: 85000000,
          impactScore: 6.5,
          tags: ['operasional', 'approved', 'renovasi'],
        },
      });

      addActivity({
        type: 'comment',
        actor: { name: 'Finance Admin', role: 'Finance Department' },
        action: 'mengomentari',
        target: 'Invoice INV-2026-123',
        details: 'Menambahkan catatan: "Customer sudah confirm pembayaran akan dilakukan tanggal 25 Januari 2026 via transfer bank."',
        metadata: {
          amount: 125000000,
          impactScore: 5.0,
          tags: ['invoice', 'payment', 'confirmed'],
        },
      });
    }
  }, []);
};
