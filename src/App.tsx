import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './components/RequireAuth'
import { useAuth } from './hooks/useAuth'
import { History } from './pages/History'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Profile } from './pages/Profile'
import { PublicProfile } from './pages/PublicProfile'
import { Settings } from './pages/Settings'
import { Signup } from './pages/Signup'
import { Stats } from './pages/Stats'
import { WorkoutDetail } from './pages/WorkoutDetail'

function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-text">
        <p className="text-white/40">Загрузка...</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/u/:username" element={<PublicProfile />} />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />
        <Route
          path="/profile/stats"
          element={
            <RequireAuth>
              <Stats />
            </RequireAuth>
          }
        />
        <Route
          path="/profile/history"
          element={
            <RequireAuth>
              <History />
            </RequireAuth>
          }
        />
        <Route
          path="/profile/history/:id"
          element={
            <RequireAuth>
              <WorkoutDetail />
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <Settings />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
