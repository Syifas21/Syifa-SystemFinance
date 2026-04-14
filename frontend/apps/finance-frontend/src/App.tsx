import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import COA from "./pages/COA";
import FinancialCockpit from "./pages/FinancialCockpit";
import CEOFinancialCockpit from "./pages/CEO/FinancialCockpit/CEOFinancialCockpit";
import GeneralJournalForm from "./pages/JournalEntry/GeneralJournalForm";
import InvoiceManagementComplete from "./pages/Invoice/InvoiceManagementComplete";
import InvoiceDetail from "./pages/Invoice/InvoiceDetail";
import InvoiceTemplateView from "./pages/Invoice/InvoiceTemplateView";
import InvoiceDetailTabs from "./pages/Invoice/InvoiceDetailTabs";
import SalesQuotation from "./pages/Sales/SalesQuotation";
import PayablesManagement from "./pages/Payables/PayablesNew";
import PaymentGateway from "./pages/Payables/PaymentGateway";
import FinanceDashboard from "./pages/Dashboard/FinanceDashboard";
import FinanceDashboardV2 from "./pages/Dashboard/FinanceDashboardV2";
import BankReconciliation from "./pages/BankReconciliation";
import FinancialReports from "./pages/Reports/FinancialReports";
import CEOFinancialReports from "./pages/CEO/CEOFinancialReports";
import CEODashboard from "./pages/CEO/CEODashboard";
import CEODashboardV2 from "./pages/CEO/CEODashboardV2";
import MarginApproval from "./pages/Approvals/MarginApproval";
import { useAuthStore } from "./store/authStore";
import { useInitializeSampleData } from "./hooks/useInitializeSampleData";
import { NotificationProvider } from "./contexts/NotificationContext";
import { NotificationContainer } from "./components/Notification/NotificationContainer";

// Lazy load CEO monitoring components to avoid build errors
const CEOInvoiceMonitor = lazy(() => import("./pages/CEO/Monitoring/CEOInvoiceMonitor"));
const CEOPayablesMonitor = lazy(() => import("./pages/CEO/Monitoring/CEOPayablesMonitor"));
const CEOBankMonitor = lazy(() => import("./pages/CEO/Monitoring/CEOBankMonitor"));
const CEOJournalMonitor = lazy(() => import("./pages/CEO/Monitoring/CEOJournalMonitor"));

function App() {
  const { isAuthenticated, user } = useAuthStore();
  useInitializeSampleData();

  // wrapper used for /reports route so that a CEO can temporarily view the
  // "admin" report page (FinancialReports) by passing ?viewAdmin=1.  That makes it
  // possible for the quick‑report buttons on the dashboard to open a new tab with
  // the real report generator and export functionality.
  const ReportsWrapper: React.FC = () => {
    const { user } = useAuthStore();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const viewAdmin = params.get('viewAdmin');
    if (user?.role === 'CEO' && viewAdmin !== '1') {
      return <CEOFinancialReports />;
    }
    return <FinancialReports />;
  };

  return (
    <NotificationProvider>
      <ErrorBoundary>
        <Router>
          <Routes>
            {/* Public Route - Login */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes - Require Authentication */}
            <Route path="/*" element={
              <ProtectedRoute>
                <Layout>
                  <ErrorBoundary>
                    <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={
                      user?.role === 'CEO' ? <CEODashboardV2 /> : <FinanceDashboardV2 />
                    } />
                    <Route path="/coa" element={<COA />} />
                    <Route path="/financial-cockpit" element={
                      user?.role === 'CEO' ? <CEOFinancialCockpit /> : <FinancialCockpit />
                    } />
                    <Route path="/admin/policies/finance" element={
                      user?.role === 'CEO' ? <CEOFinancialCockpit /> : <FinancialCockpit />
                    } />
                    <Route path="/sales/quotation" element={<SalesQuotation />} />
                    <Route path="/invoices" element={
                      <ErrorBoundary>
                        <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div></div>}>
                          {user?.role === 'CEO' ? <CEOInvoiceMonitor /> : <InvoiceManagementComplete />}
                        </Suspense>
                      </ErrorBoundary>
                    } />
                    <Route path="/invoices/:id" element={<InvoiceDetail />} />
                    <Route path="/invoices/:id/template" element={<InvoiceTemplateView />} />
                    <Route path="/invoices/new-from-quotation" element={<InvoiceDetailTabs />} />
                    <Route path="/ap" element={
                      <ErrorBoundary>
                        <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div></div>}>
                          {user?.role === 'CEO' ? <CEOPayablesMonitor /> : <PayablesManagement />}
                        </Suspense>
                      </ErrorBoundary>
                    } />
                    <Route path="/payables" element={
                      <ErrorBoundary>
                        <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div></div>}>
                          {user?.role === 'CEO' ? <CEOPayablesMonitor /> : <PayablesManagement />}
                        </Suspense>
                      </ErrorBoundary>
                    } />
                    <Route path="/finance/payables" element={<PayablesManagement />} />
                    <Route path="/finance/payment/:id" element={<PaymentGateway />} />
                    <Route path="/bank-reconciliation" element={
                      <ErrorBoundary>
                        <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div></div>}>
                          {user?.role === 'CEO' ? <CEOBankMonitor /> : <BankReconciliation />}
                        </Suspense>
                      </ErrorBoundary>
                    } />
                    <Route path="/journals" element={
                      <ErrorBoundary>
                        <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div></div>}>
                          {user?.role === 'CEO' ? <CEOJournalMonitor /> : <Dashboard />}
                        </Suspense>
                      </ErrorBoundary>
                    } />
                    <Route path="/approvals/margin" element={<MarginApproval />} />
                    <Route path="/journal" element={<Dashboard />} />
                    <Route path="/journals" element={<Dashboard />} />
                    <Route path="/reports" element={<ReportsWrapper />} />
                    <Route path="/settings" element={<Dashboard />} />
                  </Routes>
                </ErrorBoundary>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
      <NotificationContainer />
    </ErrorBoundary>
    </NotificationProvider>
  );
}

export default App;
