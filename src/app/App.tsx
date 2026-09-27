import { lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ButtonLink, PageHeader } from '../components/ui';
import Layout from './Layout';

// Each screen is loaded only when you open it (smaller first download).
const Dashboard = lazy(() => import('../features/dashboard/DashboardPage'));
const Assessment = lazy(() => import('../features/assessment/AssessmentPage'));
const TypingTest = lazy(() => import('../features/typing/TypingPage'));
const NumpadDrill = lazy(() => import('../features/numpad/NumpadPage'));
const CopyTest = lazy(() => import('../features/copy/CopyPage'));
const DocumentEncoding = lazy(() => import('../features/encoding/EncodingPage'));
const QcCheck = lazy(() => import('../features/qc/QcPage'));
const ExcelPractice = lazy(() => import('../features/excel/ExcelPage'));
const Settings = lazy(() => import('../features/settings/SettingsPage'));

function NotFound() {
  return (
    <div>
      <PageHeader title="Hindi makita ang page" description="Baka mali ang link. Bumalik na lang sa Home." />
      <ButtonLink to="/" size="lg">
        Bumalik sa Home
      </ButtonLink>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="assessment" element={<Assessment />} />
          <Route path="typing" element={<TypingTest />} />
          <Route path="numpad" element={<NumpadDrill />} />
          <Route path="copy" element={<CopyTest />} />
          <Route path="encoding" element={<DocumentEncoding />} />
          <Route path="qc" element={<QcCheck />} />
          <Route path="excel" element={<ExcelPractice />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
