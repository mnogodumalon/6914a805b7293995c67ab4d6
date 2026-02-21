import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import UebungenPage from '@/pages/UebungenPage';
import WorkoutsPage from '@/pages/WorkoutsPage';
import WorkoutLogsPage from '@/pages/WorkoutLogsPage';
import ZielePage from '@/pages/ZielePage';
import ErnaehrungPage from '@/pages/ErnaehrungPage';
import KoerperdatenPage from '@/pages/KoerperdatenPage';

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="uebungen" element={<UebungenPage />} />
          <Route path="workouts" element={<WorkoutsPage />} />
          <Route path="workout-logs" element={<WorkoutLogsPage />} />
          <Route path="ziele" element={<ZielePage />} />
          <Route path="ernaehrung" element={<ErnaehrungPage />} />
          <Route path="koerperdaten" element={<KoerperdatenPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}