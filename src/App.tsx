import './App.css'
import Dashboard from '@/pages/Dashboard'
import { Toaster } from '@/components/ui/sonner'

function App() {
  return (
    <>
      <Dashboard />
      <Toaster position="top-right" richColors />
    </>
  )
}

export default App
