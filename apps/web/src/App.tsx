import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Prospects } from './pages/Prospects';
import { Units } from './pages/Units';
import { Tours } from './pages/Tours';
import { Tasks } from './pages/Tasks';
import { Activity } from './pages/Activity';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="prospects" element={<Prospects />} />
          <Route path="units" element={<Units />} />
          <Route path="tours" element={<Tours />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="activity" element={<Activity />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
