import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

// Pages
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { UploadPage } from '@/pages/UploadPage';
import { ExtractionPage } from '@/pages/ExtractionPage';
import { CarePlanPage } from '@/pages/CarePlanPage';
import { FaithfulnessPage } from '@/pages/FaithfulnessPage';
import { TranslationPage } from '@/pages/TranslationPage';
import { ReadabilityPage } from '@/pages/ReadabilityPage';
import { FridgeSheetPage } from '@/pages/FridgeSheetPage';
import { MedicineTimetablePage } from '@/pages/MedicineTimetablePage';
import { AudioPage } from '@/pages/AudioPage';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AdminPage } from '@/pages/AdminPage';
import { VerificationInboxPage } from '@/pages/VerificationInboxPage';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Authenticated Application Shell Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/extraction" element={<ExtractionPage />} />
        <Route path="/care-plan" element={<CarePlanPage />} />
        <Route path="/faithfulness" element={<FaithfulnessPage />} />
        <Route path="/translation" element={<TranslationPage />} />
        <Route path="/readability" element={<ReadabilityPage />} />
        <Route path="/fridge-sheet" element={<FridgeSheetPage />} />
        <Route path="/medicine-timetable" element={<MedicineTimetablePage />} />
        <Route path="/audio" element={<AudioPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/verification-inbox" element={<VerificationInboxPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
