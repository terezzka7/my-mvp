import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { History } from './pages/History'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Profile } from './pages/Profile'
import { PublicProfile } from './pages/PublicProfile'
import { Settings } from './pages/Settings'
import { Stats } from './pages/Stats'
import { WorkoutDetail } from './pages/WorkoutDetail'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/u/:username" element={<PublicProfile />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/stats" element={<Stats />} />
        <Route path="/profile/history" element={<History />} />
        <Route path="/profile/history/:id" element={<WorkoutDetail />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
