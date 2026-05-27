import { useState, useEffect } from 'react'
import {
  Box, Typography, Avatar, Button, Chip,
  Table, TableBody, TableCell, TableHead, TableRow,
} from '@mui/material'
import TopNavbar from "../components/ui/TopNavbar.jsx"
import { adminAPI } from '../services/api'

// ─── Sub-components ───────────────────────────────────────────────────────────

const f = { fontFamily: '"Plus Jakarta Sans", sans-serif' }

function StatusChip({ active }) {
  const status = Number(active)
  const map = {
    1: { label: 'Pendente',  bg: '#fef3c7', color: '#92400e' },
    2: { label: 'Rejeitada', bg: '#fee2e2', color: '#991b1b' },
    3: { label: 'Aprovada',  bg: '#d1fae5', color: '#065f46' },
  }
  const s = map[status] || map[1]
  return <Chip label={s.label} size="small" sx={{ background: s.bg, color: s.color, fontWeight: 600, fontSize: '0.75rem' }} />
}

function StatCard({ icon, label, value, color }) {
  return (
    <Box sx={{ background: '#fff', borderRadius: '16px', p: 3, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Typography sx={{ fontSize: '1.5rem' }}>{icon}</Typography>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: color, mt: 0.5 }} />
      </Box>
      <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1, ...f }}>{value}</Typography>
      <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8', mt: 0.5, ...f }}>{label}</Typography>
    </Box>
  )
}

function SectionCard({ title, children }) {
  return (
    <Box sx={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}>
      <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #f1f5f9' }}>
        <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', ...f }}>{title}</Typography>
      </Box>
      {children}
    </Box>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard({ user, onLogout }) {
  const [tab, setTab] = useState('visao-geral')
  const [companies, setCompanies] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [companiesData, usersData] = await Promise.all([
          adminAPI.getCompanies(),
          adminAPI.getUsers(),
        ])
        setCompanies(companiesData)
        setUsers(usersData)
      } catch (error) {
        console.error('Failed to load admin data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const pending  = companies.filter(c => Number(c.active) === 1)
  const approved = companies.filter(c => Number(c.active) === 3)

  const approve = async (id) => {
    try {
      await adminAPI.approveCompany(id)
      setCompanies(p => p.map(c => c.id === id ? { ...c, active: 3 } : c))
    } catch (error) {
      console.error('Failed to approve company:', error)
    }
  }

  const reject = async (id) => {
    try {
      await adminAPI.rejectCompany(id)
      setCompanies(p => p.map(c => c.id === id ? { ...c, active: 2 } : c))
    } catch (error) {
      console.error('Failed to reject company:', error)
    }
  }

  const navLinks = [
    { key: 'visao-geral', label: '📊 Visão geral' },
    { key: 'empresas',    label: '🏢 Empresas'    },
    { key: 'usuarios',    label: '👤 Usuários'    },
  ]

  const thStyle = { color: '#94a3b8', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', py: 1.5, ...f }
  const tdStyle = { borderBottom: '1px solid #f8fafc', py: 2 }

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8fafc', ...f }}>
      <TopNavbar links={navLinks} activeTab={tab} onTab={setTab} userName={user?.name || 'Administrador'} onLogout={onLogout} />

      <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', ...f }}>
            {tab === 'visao-geral' && 'Visão geral'}
            {tab === 'empresas'    && 'Gerenciar empresas'}
            {tab === 'usuarios'   && 'Gerenciar usuários'}
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8', mt: 0.25, ...f }}>Painel de administração</Typography>
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2, mb: 4 }}>
          <StatCard icon="👤" label="Usuários clientes" value={users.length} color="#3b82f6" />
          <StatCard icon="🏢" label="Empresas"          value={companies.length} color="#8b5cf6" />
          <StatCard icon="⏳" label="Pendentes"         value={pending.length}   color="#f59e0b" />
          <StatCard icon="✅" label="Aprovadas"         value={approved.length}  color="#10b981" />
        </Box>

        {/* Visão geral */}
        {tab === 'visao-geral' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <SectionCard title="Aprovações pendentes">
              <Box sx={{ p: 3 }}>
                {pending.length === 0
                  ? <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8', ...f }}>Nenhuma pendência.</Typography>
                  : pending.map(c => (
                    <Box key={c.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5, borderBottom: '1px solid #f8fafc', '&:last-child': { borderBottom: 0 } }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', ...f }}>{c.name}</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', ...f }}>{c.email}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" onClick={() => approve(c.id)} sx={{ background: '#d1fae5', color: '#065f46', fontSize: '0.75rem', px: 1.5, minWidth: 0, '&:hover': { background: '#a7f3d0' } }}>Aprovar</Button>
                        <Button size="small" onClick={() => reject(c.id)}  sx={{ background: '#fee2e2', color: '#991b1b', fontSize: '0.75rem', px: 1.5, minWidth: 0, '&:hover': { background: '#fecaca' } }}>Rejeitar</Button>
                      </Box>
                    </Box>
                  ))
                }
              </Box>
            </SectionCard>

            <SectionCard title="Resumo do sistema">
              <Box sx={{ p: 3 }}>
                {[
                  { label: 'Total de usuários clientes', value: users.length },
                  { label: 'Total de empresas',          value: companies.length },
                  { label: 'Empresas aprovadas',         value: approved.length },
                  { label: 'Empresas rejeitadas',        value: companies.filter(c => Number(c.active) === 2).length },
                ].map(({ label, value }) => (
                  <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25, borderBottom: '1px solid #f8fafc', '&:last-child': { borderBottom: 0 } }}>
                    <Typography sx={{ fontSize: '0.85rem', color: '#64748b', ...f }}>{label}</Typography>
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', ...f }}>{value}</Typography>
                  </Box>
                ))}
              </Box>
            </SectionCard>
          </Box>
        )}

        {/* Empresas */}
        {tab === 'empresas' && (
          <SectionCard title="Empresas cadastradas">
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': thStyle }}>
                  <TableCell>Empresa</TableCell>
                  <TableCell>E-mail</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {companies.map(c => (
                  <TableRow key={c.id} sx={{ '& td': tdStyle, '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, background: '#e0e7ff', color: '#3730a3', fontSize: '0.75rem', fontWeight: 700 }}>{c.name.charAt(0)}</Avatar>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', ...f }}>{c.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Typography sx={{ fontSize: '0.875rem', color: '#64748b', ...f }}>{c.email}</Typography></TableCell>
                    <TableCell><StatusChip active={c.active} /></TableCell>
                    <TableCell align="right">
                      {Number(c.active) === 1
                        ? <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button size="small" onClick={() => approve(c.id)} sx={{ background: '#10b981', color: '#fff', fontSize: '0.75rem', px: 1.5, minWidth: 0, '&:hover': { background: '#059669' } }}>Aprovar</Button>
                            <Button size="small" onClick={() => reject(c.id)}  sx={{ border: '1px solid #fca5a5', color: '#dc2626', fontSize: '0.75rem', px: 1.5, minWidth: 0, '&:hover': { background: '#fef2f2' } }}>Rejeitar</Button>
                          </Box>
                        : <Typography sx={{ fontSize: '0.75rem', color: '#cbd5e1', ...f }}>—</Typography>
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        )}

        {/* Usuários */}
        {tab === 'usuarios' && (
          <SectionCard title="Usuários cadastrados">
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': thStyle }}>
                  <TableCell>Nome</TableCell>
                  <TableCell>E-mail</TableCell>
                  <TableCell>Tipo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id} sx={{ '& td': tdStyle, '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, background: '#dbeafe', color: '#1e40af', fontSize: '0.75rem', fontWeight: 700 }}>{u.name.charAt(0)}</Avatar>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', ...f }}>{u.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Typography sx={{ fontSize: '0.875rem', color: '#64748b', ...f }}>{u.email}</Typography></TableCell>
                    <TableCell><Chip label="Cliente" size="small" sx={{ background: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: '0.75rem' }} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        )}
      </Box>
    </Box>
  )
}