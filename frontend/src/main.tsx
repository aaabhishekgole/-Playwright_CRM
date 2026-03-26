import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { findMenuContext, hasMenuAccess } from './utils/menuHierarchy';
import { CashlessApprovalPage } from './pages/CashlessApprovalPage';
import { DashboardPage } from './pages/DashboardPage';
import { DeliveryTrackingPage } from './pages/DeliveryTrackingPage';
import { EstimateApprovalPage } from './pages/EstimateApprovalPage';
import { LoginPage } from './pages/LoginPage';
import { PaymentReconciliationPage } from './pages/PaymentReconciliationPage';
import { PickupImagesPage } from './pages/PickupImagesPage';
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
        <Route path="/requests" element={<ProtectedMenuRoute sectionId="service-requests" itemId="all-requests"><ServiceRequestListPage /></ProtectedMenuRoute>} />
        <Route path="/requests/:id" element={<ProtectedMenuRoute sectionId="service-requests" itemId="all-requests"><ServiceRequestDetailsPage /></ProtectedMenuRoute>} />
        <Route path="/pickup-images" element={<ProtectedMenuRoute sectionId="pickup-management" itemId="picked-up-devices"><PickupImagesPage /></ProtectedMenuRoute>} />
        <Route path="/timeline" element={<ProtectedMenuRoute sectionId="audit" itemId="status-history"><StatusTimelinePage /></ProtectedMenuRoute>} />
        <Route path="/estimate-approval" element={<ProtectedMenuRoute sectionId="estimates" itemId="awaiting-customer-approval"><EstimateApprovalPage /></ProtectedMenuRoute>} />
        <Route path="/cashless-approval" element={<ProtectedMenuRoute sectionId="cashless" itemId="approval-queue"><CashlessApprovalPage /></ProtectedMenuRoute>} />
        <Route path="/payment-reconciliation" element={<ProtectedMenuRoute sectionId="billing" itemId="payment-reconciliation"><PaymentReconciliationPage /></ProtectedMenuRoute>} />
        <Route path="/delivery-tracking" element={<ProtectedMenuRoute sectionId="delivery" itemId="out-for-delivery"><DeliveryTrackingPage /></ProtectedMenuRoute>} />
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
        <Route path="/*" element={<ProtectedApp />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RootApp />
    </AuthProvider>
  </React.StrictMode>,
);
