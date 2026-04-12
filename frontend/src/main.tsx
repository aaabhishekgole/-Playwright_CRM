import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './hooks/useToast';
import { findMenuContext, hasMenuAccess } from './utils/menuHierarchy';
import { CashlessApprovalPage } from './pages/CashlessApprovalPage';
import { ClaimDetailPage } from './pages/ClaimDetailPage';
import { ClaimsListPage } from './pages/ClaimsListPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { ClaimRegistrationPage } from './pages/ClaimRegistrationPage';
import { DashboardPage } from './pages/DashboardPage';
import { DeliveryTrackingPage } from './pages/DeliveryTrackingPage';
import { EstimateApprovalPage } from './pages/EstimateApprovalPage';
import { InsuranceSubmissionPage } from './pages/InsuranceSubmissionPage';
import { InvoiceVerificationPage } from './pages/InvoiceVerificationPage';
import { LoginPage } from './pages/LoginPage';
import { PaymentReconciliationPage } from './pages/PaymentReconciliationPage';
import { PickupImagesPage } from './pages/PickupImagesPage';
import { PickupRunnerPortalPage } from './pages/PickupRunnerPortalPage';
import { RunnerAccessPage } from './pages/RunnerAccessPage';
import { RunnerAppInboxPage } from './pages/RunnerAppInboxPage';
import { ServiceRequestDetailsPage } from './pages/ServiceRequestDetailsPage';
import { ServiceRequestListPage } from './pages/ServiceRequestListPage';
import { StatusTimelinePage } from './pages/StatusTimelinePage';
import { WorkspacePage } from './pages/WorkspacePage';
import './styles.css';

function ProtectedMenuRoute({ sectionId, itemId, children }: { sectionId: string; itemId: string; children: JSX.Element }) {
  const { role } = useAuth();
  const { section, item } = findMenuContext(sectionId, itemId);

  if (!section || !item || !hasMenuAccess(role, sectionId, itemId)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function ProtectedApp() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/requests" element={<ProtectedMenuRoute sectionId="service-requests" itemId="all-requests"><ServiceRequestListPage title="Open Claims" /></ProtectedMenuRoute>} />
        <Route path="/requests/:id" element={<ProtectedMenuRoute sectionId="service-requests" itemId="all-requests"><ServiceRequestDetailsPage /></ProtectedMenuRoute>} />
        <Route path="/pickup-images" element={<ProtectedMenuRoute sectionId="pickup-management" itemId="picked-up-devices"><PickupImagesPage /></ProtectedMenuRoute>} />
        <Route path="/timeline" element={<ProtectedMenuRoute sectionId="audit" itemId="status-history"><StatusTimelinePage /></ProtectedMenuRoute>} />
        <Route path="/workspace/dashboard/sla-tat-summary" element={<ProtectedMenuRoute sectionId="dashboard" itemId="sla-tat-summary"><ServiceRequestListPage mode="sla" title="SLA / TAT Summary" description="Track open claims, SLA breaches, and turnaround pressure across the portal." /></ProtectedMenuRoute>} />
        <Route path="/workspace/dashboard/recent-activities" element={<ProtectedMenuRoute sectionId="dashboard" itemId="recent-activities"><StatusTimelinePage title="Recent Activities" description="Recent status movement and workflow changes across all live requests." /></ProtectedMenuRoute>} />
        <Route path="/workspace/dashboard/alerts-escalations" element={<ProtectedMenuRoute sectionId="dashboard" itemId="alerts-escalations"><ServiceRequestListPage mode="alerts" title="Alerts & Escalations" description="Claims with SLA breach risk or failed notification delivery that need immediate attention." /></ProtectedMenuRoute>} />
        <Route path="/estimate-approval" element={<ProtectedMenuRoute sectionId="estimates" itemId="awaiting-customer-approval"><EstimateApprovalPage /></ProtectedMenuRoute>} />
        <Route path="/cashless-approval" element={<ProtectedMenuRoute sectionId="cashless" itemId="approval-queue"><CashlessApprovalPage /></ProtectedMenuRoute>} />
        <Route path="/payment-reconciliation" element={<ProtectedMenuRoute sectionId="billing" itemId="payment-reconciliation"><PaymentReconciliationPage /></ProtectedMenuRoute>} />
        <Route path="/delivery-tracking" element={<ProtectedMenuRoute sectionId="delivery" itemId="out-for-delivery"><DeliveryTrackingPage /></ProtectedMenuRoute>} />
        <Route path="/workspace/service-requests/create-request" element={<ProtectedMenuRoute sectionId="service-requests" itemId="create-request"><ClaimRegistrationPage /></ProtectedMenuRoute>} />
        <Route path="/workspace/service-requests/open-requests" element={<ProtectedMenuRoute sectionId="service-requests" itemId="open-requests"><ServiceRequestListPage mode="open" title="Open Claims" /></ProtectedMenuRoute>} />
        <Route path="/workspace/service-requests/in-progress" element={<ProtectedMenuRoute sectionId="service-requests" itemId="in-progress"><ServiceRequestListPage mode="in-progress" title="In Progress Claims" description="Claims already in pickup, hub, repair, approval, dispatch, billing, or payment stages." /></ProtectedMenuRoute>} />
        <Route path="/workspace/service-requests/closed-requests" element={<ProtectedMenuRoute sectionId="service-requests" itemId="closed-requests"><ServiceRequestListPage mode="closed" title="Closed Claims" description="Completed claims that have gone through the workflow and reached final closure." /></ProtectedMenuRoute>} />
        <Route path="/workspace/service-requests/cancelled-requests" element={<ProtectedMenuRoute sectionId="service-requests" itemId="cancelled-requests"><ServiceRequestListPage mode="cancelled" title="Cancelled Claims" description="Cancelled or voided claims with filterable ticket, customer, and device references." /></ProtectedMenuRoute>} />
        <Route path="/workspace/service-requests/search-request" element={<ProtectedMenuRoute sectionId="service-requests" itemId="search-request"><ServiceRequestListPage mode="all" title="Search Claims" description="Search claim records by loan, ticket, COI, device identifier, and settlement state." /></ProtectedMenuRoute>} />
        <Route path="/documents" element={<ProtectedMenuRoute sectionId="documents" itemId="document-library"><DocumentsPage /></ProtectedMenuRoute>} />
        {/* Cashless Claim Module */}
        <Route path="/claims" element={<ProtectedMenuRoute sectionId="claims" itemId="all-claims"><ClaimsListPage /></ProtectedMenuRoute>} />
        <Route path="/claims/:claimId" element={<ProtectedMenuRoute sectionId="claims" itemId="all-claims"><ClaimDetailPage /></ProtectedMenuRoute>} />
        <Route path="/invoice-verification" element={<ProtectedMenuRoute sectionId="invoice-verification" itemId="invoice-queue"><InvoiceVerificationPage /></ProtectedMenuRoute>} />
        <Route path="/insurance-submission" element={<ProtectedMenuRoute sectionId="insurance-submission" itemId="ready-for-insurance"><InsuranceSubmissionPage /></ProtectedMenuRoute>} />
        <Route path="/workspace/:sectionId/:itemId" element={<WorkspacePage />} />
      </Route>
    </Routes>
  );
}

function RootApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/runner-app" element={<RunnerAppInboxPage />} />
        <Route path="/runner-access/:token" element={<RunnerAccessPage />} />
        <Route path="/runner-portal/:token" element={<PickupRunnerPortalPage />} />
        <Route path="/*" element={<ProtectedApp />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <AuthProvider>
        <RootApp />
      </AuthProvider>
    </ToastProvider>
  </React.StrictMode>,
);
