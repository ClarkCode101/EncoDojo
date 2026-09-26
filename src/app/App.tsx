import { lazy } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import Layout from './Layout';

// Each screen is loaded only when you open it (smaller first download).
const Dashboard = lazy(() => import('../features/dashboard/DashboardPage'));
const TypingTest = lazy(() => import('../features/typing/TypingPage'));
const NumpadDrill = lazy(() => import('../features/numpad/NumpadPage'));
const Settings = lazy(() => import('../features/settings/SettingsPage'));

function NotFound() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <Link to="/" className="mt-2 inline-block text-blue-700 underline">
        Back to Dashboard
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="typing" element={<TypingTest />} />
          <Route path="numpad" element={<NumpadDrill />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
