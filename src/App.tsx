import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { DashboardOverview } from '@/pages/DashboardOverview'
import { TrainingPage } from '@/pages/TrainingPage'
import { WorkoutLogsPage } from '@/pages/WorkoutLogsPage'
import { UebungenPage } from '@/pages/UebungenPage'
import { ErnaehrungPage } from '@/pages/ErnaehrungPage'
import { KoerperdatenPage } from '@/pages/KoerperdatenPage'
import { ZielePage } from '@/pages/ZielePage'
import { Toaster } from '@/components/ui/sonner'

function App() {
  return (
    <>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardOverview />} />
          <Route path="/training" element={<TrainingPage />} />
          <Route path="/workout-logs" element={<WorkoutLogsPage />} />
          <Route path="/uebungen" element={<UebungenPage />} />
          <Route path="/ernaehrung" element={<ErnaehrungPage />} />
          <Route path="/koerperdaten" element={<KoerperdatenPage />} />
          <Route path="/ziele" element={<ZielePage />} />
        </Routes>
      </Layout>
      <Toaster position="top-right" />
    </>
  )
}

export default App
