import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { db } from './lib/db'
import Login from './pages/Login'
import OrganizerConsole from './pages/OrganizerConsole'
import OrganizerSession from './pages/OrganizerSession'
import CheckIn from './pages/CheckIn'
import MyTeam from './pages/MyTeam'
import MasterBoard from './pages/MasterBoard'
import './App.css'

function ProtectedRoute({ children }) {
  const { isLoading, user } = db.useAuth()
  if (isLoading) return <div className="loading">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sign-in" element={<Navigate to="/login" replace />} />
        <Route
          path="/organizer"
          element={
            <ProtectedRoute>
              <OrganizerConsole />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/sessions/:id"
          element={
            <ProtectedRoute>
              <OrganizerSession />
            </ProtectedRoute>
          }
        />
        <Route
          path="/check-in"
          element={
            <ProtectedRoute>
              <CheckIn />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-team/:sessionId"
          element={
            <ProtectedRoute>
              <MyTeam />
            </ProtectedRoute>
          }
        />
        <Route path="/master/:sessionId" element={<MasterBoard />} />
      </Routes>
    </BrowserRouter>
  )
}
