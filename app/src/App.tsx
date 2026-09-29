import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Practice } from './pages/Practice'
import { Exam } from './pages/Exam'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Practice />} />
          <Route path="/practice" element={<Navigate to="/" replace />} />
          <Route path="/exam" element={<Exam />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
