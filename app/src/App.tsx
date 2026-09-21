import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Practice } from './pages/Practice'
import { WeaknessHunt } from './pages/WeaknessHunt'
import { RapidFire } from './pages/RapidFire'
import { Topics } from './pages/Topics'
import { Exam } from './pages/Exam'
import { ProgressPage } from './pages/Progress'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/weakness" element={<WeaknessHunt />} />
          <Route path="/rapid" element={<RapidFire />} />
          <Route path="/topics" element={<Topics />} />
          <Route path="/exam" element={<Exam />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
