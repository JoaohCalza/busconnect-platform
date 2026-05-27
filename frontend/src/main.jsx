import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { theme } from './theme'

import Login                from './screens/Login'
import AdminDashboard       from './screens/AdminDashboard'
import CompanyDashboard     from './screens/CompanyDashboard'
import CompanyUserDashboard from './screens/CompanyUserDashboard'
import ClientDashboard      from './screens/ClientDashboard'

// ─── Tipos de usuário retornados pela API ─────────────────────────────────────
//
// user = {
//   id:               number
//   name:             string
//   email:            string
//   type:             'admin' | 'company_admin' | 'company_user' | 'cliente'
//   company_id:       number | null   ← null para admin e cliente
//   is_company_admin: boolean         ← true = administrador da empresa
// }
//
// Roteamento:
//   type === 'admin'        → AdminDashboard        (sem company_id)
//   type === 'company_admin'→ CompanyDashboard       (gerencia usuários da empresa)
//   type === 'company_user' → CompanyUserDashboard   (vê perfil próprio + empresa)
//   type === 'cliente'      → ClientDashboard        (sem company_id)

function App() {
  const [user, setUser] = useState(null)

  const handleLoginSuccess = (userData) => setUser(userData)
  const handleLogout       = ()          => setUser(null)

  if (!user) return <Login onLoginSuccess={handleLoginSuccess} />

  if (user.type === 'admin')        return <AdminDashboard       user={user} onLogout={handleLogout} />
  if (user.type === 'company_admin') return <CompanyDashboard     user={user} onLogout={handleLogout} />
  if (user.type === 'company_user')  return <CompanyUserDashboard user={user} onLogout={handleLogout} />
  if (user.type === 'cliente')      return <ClientDashboard      user={user} onLogout={handleLogout} />

  return <Login onLoginSuccess={handleLoginSuccess} />
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
)