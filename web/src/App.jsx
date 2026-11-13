import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Send from './pages/Send.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminLayout from './pages/AdminLayout.jsx'
import AdminList from './pages/AdminList.jsx'
import AdminMessage from './pages/AdminMessage.jsx'
import AdminPassword from './pages/AdminPassword.jsx'

export default function App() {
  return (
    <Routes>
      {/* Студенты */}
      <Route path="/" element={<Home />} />
      <Route path="/send/:staffId" element={<Send />} />

      {/* Сотрудники */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/password" element={<AdminPassword />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminList />} />
        <Route path="m/:id" element={<AdminMessage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
