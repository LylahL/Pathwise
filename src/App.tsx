import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthGate } from './auth'
import { StoreProvider } from './store'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import CareerFit from './pages/CareerFit'
import Opportunities from './pages/Opportunities'
import Applications from './pages/Applications'
import Skills from './pages/Skills'
import Experiments from './pages/Experiments'
import Profile from './pages/Profile'
import JobStrategy from './pages/JobStrategy'

export default function App() {
  return (
    <AuthGate>
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="fit" element={<CareerFit />} />
            <Route path="opportunities" element={<Opportunities />} />
            <Route path="job-strategy" element={<JobStrategy />} />
            <Route path="applications" element={<Applications />} />
            <Route path="skills" element={<Skills />} />
            <Route path="experiments" element={<Experiments />} />
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<Dashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
    </AuthGate>
  )
}
