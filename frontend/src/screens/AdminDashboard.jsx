import { useState, useEffect } from 'react'
import {
  Box, Typography, Avatar, Button, Chip, CircularProgress,
  Table, TableBody, TableCell, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl,
} from '@mui/material'
import TopNavbar from "../components/ui/TopNavbar.jsx"
import { adminAPI, tripAPI } from '../services/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const f = { fontFamily: '"Plus Jakarta Sans", sans-serif' }
const thStyle = { color: '#94a3b8', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', py: 1.5, ...f }
const tdStyle = { borderBottom: '1px solid #f8fafc', py: 1.5 }

const toDateInput = (val) => { if (!val) return ''; return String(val).substring(0, 10) }

const downloadCSV = (rows, filename) => {
  const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

const TRIP_STATUS_MAP = {
  scheduled:   { label: 'Agendada',     bg: '#eff6ff', color: '#1a56db' },
  in_progress: { label: 'Em andamento', bg: '#fef3c7', color: '#92400e' },
  completed:   { label: 'Concluída',    bg: '#f0fdf4', color: '#166534' },
  cancelled:   { label: 'Cancelada',    bg: '#fee2e2', color: '#991b1b' },
}

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MONTHS = MONTH_NAMES.map((name, i) => ({ value: String(i + 1).padStart(2, '0'), label: name }))

// ─── Sub-components ───────────────────────────────────────────────────────────

function CompanyStatusChip({ active }) {
  const status = Number(active)
  const map = {
    1: { label: 'Pendente',  bg: '#fef3c7', color: '#92400e' },
    2: { label: 'Rejeitada', bg: '#fee2e2', color: '#991b1b' },
    3: { label: 'Aprovada',  bg: '#d1fae5', color: '#065f46' },
    4: { label: 'Bloqueada', bg: '#f1f5f9', color: '#475569' },
  }
  const s = map[status] || map[1]
  return <Chip label={s.label} size="small" sx={{ background: s.bg, color: s.color, fontWeight: 600, fontSize: '0.75rem' }} />
}

function TripStatusChip({ status }) {
  const s = TRIP_STATUS_MAP[status] || TRIP_STATUS_MAP.scheduled
  return <Chip label={s.label} size="small" sx={{ background: s.bg, color: s.color, fontWeight: 600, fontSize: '0.72rem' }} />
}

function StatCard({ icon, label, value, color, small }) {
  return (
    <Box sx={{ background: '#ffffff',
               border: '3px solid #1a56db',
               boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
               borderRadius: '18px',
               p: 3,
               transition: '0.2s',
               '&:hover': {
                 transform: 'translateY(-4px)',
                 boxShadow: '0 20px 40px rgba(15,23,42,0.12)'
               }}}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
        <Typography sx={{ fontSize: '1.5rem' }}>{icon}</Typography>
        <Box sx={{ width: 7, height: 7, borderRadius: '50%', background: color, mt: 0.5 }} />
      </Box>
      <Typography sx={{ fontSize: small ? '1rem' : '1.1rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, ...f }}>{value}</Typography>
      <Typography sx={{ fontSize: '0.75rem', color: '#79808a', mt: 0.9, ...f }}>{label}</Typography>
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

function TripReportDialog({ open, onClose, trips }) {
  const counts = {
    scheduled:   trips.filter(t => t.status === 'scheduled').length,
    in_progress: trips.filter(t => t.status === 'in_progress').length,
    completed:   trips.filter(t => t.status === 'completed').length,
    cancelled:   trips.filter(t => t.status === 'cancelled').length,
  }
  const totalRevenue = trips.reduce((acc, t) => acc + (t.price != null ? Number(t.price) : 0), 0)
  const totalCommission = trips.reduce((acc, t) => acc + (t.commission != null ? Number(t.commission) : 0), 0)

  const handleDownload = () => {
    const headers = ['#', 'Empresa', 'Cliente', 'Origem', 'Destino', 'Veículo', 'Placa', 'Motorista', 'Data Início', 'Data Fim', 'Status', 'Valor (R$)']
    const rows = trips.map(t => [
      t.id,
      t.company?.name || '',
      t.client?.name || '',
      t.request?.origin || '',
      t.request?.destination || '',
      t.vehicle ? `${t.vehicle.brand} ${t.vehicle.model}` : '',
      t.vehicle?.plate || '',
      t.driver?.name || '',
      toDateInput(t.start_date),
      toDateInput(t.end_date),
      TRIP_STATUS_MAP[t.status]?.label || t.status,
      t.price != null ? Number(t.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '',
    ])
    downloadCSV([headers, ...rows], 'viagens-geral.csv')
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
      <DialogTitle sx={{ fontWeight: 700, ...f }}>
        <Box>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', ...f }}>Relatório Geral de Viagens</Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 400, mt: 0.25, ...f }}>
            Gerado em {new Date().toLocaleString('pt-BR')}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
          <Box sx={{ background: '#f8fafc', borderRadius: '12px', p: 2, border: '1px solid #f1f5f9' }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', ...f }}>Total</Typography>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', ...f }}>{trips.length}</Typography>
          </Box>
          {Object.entries(TRIP_STATUS_MAP).map(([k, v]) => (
            <Box key={k} sx={{ background: v.bg, borderRadius: '12px', p: 2, border: '1px solid #f1f5f9' }}>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: v.color, textTransform: 'uppercase', letterSpacing: '0.05em', ...f }}>{v.label}</Typography>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: v.color, ...f }}>{counts[k]}</Typography>
            </Box>
          ))}
          <Box sx={{ background: '#f0fdf4', borderRadius: '12px', p: 2, border: '1px solid #dcfce7', gridColumn: 'span 4' }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em', ...f }}>Receita Total</Typography>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#166534', ...f }}>
              {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </Typography>
          </Box>
          <Box sx={{ background: '#fef3c7', borderRadius: '12px', p: 2, border: '1px solid #fde68a', gridColumn: 'span 4' }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em', ...f }}>Comissão BusConnect (10%)</Typography>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#92400e', ...f }}>
              {totalCommission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} sx={{ color: '#64748b', fontWeight: 600, ...f }}>Fechar</Button>
        <Button onClick={handleDownload} variant="contained"
          sx={{ background: '#1a56db', fontWeight: 600, borderRadius: '10px', '&:hover': { background: '#1e3a8a' }, ...f }}>
          Baixar CSV
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard({ user, onLogout }) {
  const [tab, setTab]           = useState('visao-geral')
  const [companies, setCompanies] = useState([])
  const [users, setUsers]       = useState([])
  const [trips, setTrips]       = useState([])
  const [tripsLoading, setTripsLoading] = useState(false)
  const [loading, setLoading]   = useState(true)
  const [tripFilter, setTripFilter]     = useState('all')
  const [monthFilter, setMonthFilter]   = useState('all')
  const [reportOpen, setReportOpen]     = useState(false)

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
  }, [tab])

  useEffect(() => {
  setTripsLoading(true)
  tripAPI.getAll()
    .then(setTrips)
    .catch(console.error)
    .finally(() => setTripsLoading(false))
}, [tab])

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

  const blockCompany = async (id) => {
  try {
    await adminAPI.deleteCompany(id)
    setCompanies(p => p.map(c => c.id === id ? { ...c, active: 4 } : c))
  } catch (error) {
    console.error('Failed to block company:', error)
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

  const filteredTrips = trips
    .filter(t => tripFilter === 'all' || t.status === tripFilter)
    .filter(t => monthFilter === 'all' || String(t.start_date).substring(5, 7) === monthFilter)

  const totalRevenue = trips.reduce((acc, t) => acc + (t.price != null ? Number(t.price) : 0), 0)
  const totalCommission = trips.reduce((acc, t) => acc + (t.commission != null ? Number(t.commission) : 0), 0)

  const navLinks = [
    { key: 'visao-geral', label: 'Visão geral' },
    { key: 'empresas',    label: 'Empresas'    },
    { key: 'usuarios',    label: 'Usuários'    },
    { key: 'viagens',     label: 'Viagens'     },
  ]

  const monthSelectSx = { borderRadius: '10px', background: '#f8fafc', fontSize: '0.78rem', fontWeight: 600, height: 32, '& fieldset': { borderColor: '#e2e8f0' }, '&.Mui-focused fieldset': { borderColor: '#1a56db', borderWidth: '2px' } } 

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8fafc', ...f }}>
      <TopNavbar links={navLinks} activeTab={tab} onTab={setTab} userName={user?.name || 'Administrador'} onLogout={onLogout} userId={user?.id} />

      <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography sx={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', ...f }}>
            {tab === 'visao-geral' && 'Visão Geral'}
            {tab === 'empresas' && 'Gerenciar Empresas'}
            {tab === 'usuarios' && 'Gerenciar Usuários'}
            {tab === 'viagens' && 'Todas as Viagens'}
          </Typography>

          <Typography sx={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500, ...f }}>
            Painel de Administração 
          </Typography>
        </Box>

        <Typography sx={{ fontSize: '0.85rem', color: '#030303', fontWeight: 600, ...f }}>
          {new Date().toLocaleDateString('pt-BR')}
        </Typography>
      </Box>

        {/* Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2, mb: 4 }}>
          <StatCard icon="👤" label="Clientes"          value={users.filter(u => u.account_type === 'CLIENTE').length}      color="#3b82f6" />
          <StatCard icon="🧑‍💼" label="Funcionários"      value={users.filter(u => u.account_type === 'FUNCIONARIO').length}  color="#8b5cf6" />
          <StatCard icon="🏢" label="Empresas"          value={companies.length} color="#6366f1" />
          <StatCard icon="⏳" label="Pendentes"         value={pending.length}   color="#f59e0b" />
          <StatCard icon="✅" label="Aprovadas"         value={approved.length}  color="#10b981" />
          <StatCard icon="🚌" label="Total de viagens"  value={trips.length}     color="#0ea5e9" />
          <StatCard icon="💰" label="Receita total"
            value={totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            color="#16a34a" small />
          <StatCard icon="🏦" label="Comissão BusConnect"
            value={totalCommission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            color="#f59e0b" small />
        </Box>

        {/* Visão geral */}
        {tab === 'visao-geral' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <SectionCard title="Aprovações Pendentes">
              <Box sx={{ p: 3 }}>
                {pending.length === 0
                  ? <Typography sx={{ fontSize: '0.85rem', color: '#0e0e0f', ...f }}>Nenhuma pendência.</Typography>
                  : pending.map(c => (
                    <Box key={c.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5, borderBottom: '1px solid #8b8484', '&:last-child': { borderBottom: 0 } }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', ...f }}>{c.name}</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#0e0e0f', ...f }}>{c.email}</Typography>
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

            <SectionCard title="Resumo">
              <Box sx={{ p: 3 }}>
                {[
                  { label: 'Clientes cadastrados',    value: users.filter(u => u.account_type === 'CLIENTE').length },
                  { label: 'Funcionários de empresa', value: users.filter(u => u.account_type === 'FUNCIONARIO').length },
                  { label: 'Total de empresas',        value: companies.length },
                  { label: 'Empresas aprovadas',       value: approved.length },
                  { label: 'Empresas rejeitadas',      value: companies.filter(c => Number(c.active) === 2).length },
                  { label: 'Total de viagens',         value: trips.length },
                  { label: 'Viagens concluídas',       value: trips.filter(t => t.status === 'completed').length },
                  { label: 'Receita total',            value: totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
                  { label: 'Comissão BusConnect (10%)', value: totalCommission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
                ].map(({ label, value }) => (
                  <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25, borderBottom: '1px solid #8b8484', '&:last-child': { borderBottom: 0 } }}>
                    <Typography sx={{ fontSize: '0.85rem', color: '#0e0e0f', ...f }}>{label}</Typography>
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
                    <TableCell><CompanyStatusChip active={c.active} /></TableCell>
                    <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      {Number(c.active) === 1 && <>
                        <Button size="small" onClick={() => approve(c.id)} sx={{ background: '#10b981', color: '#fff', fontSize: '0.75rem', px: 1.5, minWidth: 0, '&:hover': { background: '#059669' } }}>Aprovar</Button>
                        <Button size="small" onClick={() => reject(c.id)}  sx={{ border: '1px solid #fca5a5', color: '#dc2626', fontSize: '0.75rem', px: 1.5, minWidth: 0, '&:hover': { background: '#fef2f2' } }}>Rejeitar</Button>
                      </>}
                      {Number(c.active) !== 4 &&
                        <Button size="small" onClick={() => blockCompany(c.id)} sx={{ background: '#f1f5f9', color: '#475569', fontSize: '0.75rem', px: 1.5, minWidth: 0, '&:hover': { background: '#e2e8f0' } }}>Bloquear</Button>
                      }
                      {Number(c.active) === 4 &&
                        <Typography sx={{ fontSize: '0.75rem', color: '#cbd5e1', ...f }}>Bloqueada</Typography>
                      }
                    </Box>
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
                  <TableCell>Empresa</TableCell>
                  <TableCell>Tipo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map(u => {
                  const isEmployee = u.account_type === 'FUNCIONARIO'
                  return (
                    <TableRow key={u.id} sx={{ '& td': tdStyle, '&:last-child td': { borderBottom: 0 } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, background: isEmployee ? '#f3e8ff' : '#dbeafe', color: isEmployee ? '#7e22ce' : '#1e40af', fontSize: '0.75rem', fontWeight: 700 }}>{u.name.charAt(0)}</Avatar>
                          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', ...f }}>{u.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell><Typography sx={{ fontSize: '0.875rem', color: '#64748b', ...f }}>{u.email}</Typography></TableCell>
                      <TableCell><Typography sx={{ fontSize: '0.875rem', color: '#64748b', ...f }}>{u.company?.name || '—'}</Typography></TableCell>
                      <TableCell>
                        {isEmployee
                          ? <Chip label="Funcionário" size="small" sx={{ background: '#f3e8ff', color: '#7e22ce', fontWeight: 600, fontSize: '0.75rem' }} />
                          : <Chip label="Cliente"     size="small" sx={{ background: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: '0.75rem' }} />
                        }
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </SectionCard>
        )}

        {/* Viagens */}
        {tab === 'viagens' && (
          <Box>
            {/* Filtros */}
            <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
              {['all', 'scheduled', 'in_progress', 'completed', 'cancelled'].map(s => (
                <Button key={s} size="small" onClick={() => setTripFilter(s)}
                  sx={{ fontWeight: 600, fontSize: '0.78rem', borderRadius: '8px', px: 1.5,
                    background: tripFilter === s ? '#1a56db' : '#f1f5f9',
                    color: tripFilter === s ? '#fff' : '#64748b',
                    '&:hover': { background: tripFilter === s ? '#1e3a8a' : '#e2e8f0' }, ...f }}>
                  {s === 'all'
                    ? `Todas (${trips.length})`
                    : `${TRIP_STATUS_MAP[s]?.label} (${trips.filter(t => t.status === s).length})`}
                </Button>
              ))}
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <Select
                  value={monthFilter}
                  onChange={e => setMonthFilter(e.target.value)}
                  displayEmpty
                  sx={{ ...monthSelectSx, ...f }}
                >
                  <MenuItem value="all" sx={f}>Todos os meses</MenuItem>
                  {MONTHS.map(({ value, label }) => (
                    <MenuItem key={value} value={value} sx={f}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                size="small"
                variant="contained"
                onClick={() => setReportOpen(true)}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  borderRadius: '8px',
                  px: 2,
                  py: 0.7,
                  background: '#1a56db',
                  color: '#fff',
                  textTransform: 'none',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    background: '#1a56db',
                    boxShadow: '0 2px 5px #1a56db',
                    transform: 'translateY(-2px) scale(1.04)',
                  },
                  ...f
                }}>
                Relatório
              </Button>
            </Box>

            <Box sx={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}>
              {tripsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: '#1a56db' }} /></Box>
              ) : filteredTrips.length === 0 ? (
                <Box sx={{ p: 6, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '1.5rem', mb: 1 }}>🗺️</Typography>
                  <Typography sx={{ fontSize: '0.875rem', color: '#94a3b8', ...f }}>
                    {tripFilter === 'all' && monthFilter === 'all'
                      ? 'Nenhuma viagem registrada no sistema.'
                      : 'Nenhuma viagem para os filtros selecionados.'}
                  </Typography>
                </Box>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow sx={{ '& th': thStyle }}>
                      <TableCell>#</TableCell>
                      <TableCell>Empresa</TableCell>
                      <TableCell>Rota</TableCell>
                      <TableCell>Veículo</TableCell>
                      <TableCell>Motorista</TableCell>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Data</TableCell>
                      <TableCell>Valor</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTrips.map(t => (
                      <TableRow key={t.id} sx={{ '& td': tdStyle, '&:last-child td': { borderBottom: 0 } }}>
                        <TableCell><Typography sx={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace' }}>#{t.id}</Typography></TableCell>
                        <TableCell><Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: '#0f172a', ...f }}>{t.company?.name || '—'}</Typography></TableCell>
                        <TableCell>
                          {t.request ? (
                            <>
                              <Typography sx={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: 500, ...f }}>{t.request.origin}</Typography>
                              <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', ...f }}>→ {t.request.destination}</Typography>
                            </>
                          ) : (
                            <Typography sx={{ fontSize: '0.8rem', color: '#cbd5e1', ...f }}>—</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {t.vehicle ? (
                            <>
                              <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: '#0f172a', ...f }}>{t.vehicle.brand} {t.vehicle.model}</Typography>
                              <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>{t.vehicle.plate}</Typography>
                            </>
                          ) : (
                            <Chip label="A definir" size="small" sx={{ background: '#fef3c7', color: '#92400e', fontSize: '0.7rem' }} />
                          )}
                        </TableCell>
                        <TableCell>
                          {t.driver
                            ? <Typography sx={{ fontSize: '0.875rem', color: '#0f172a', ...f }}>{t.driver.name}</Typography>
                            : <Chip label="A definir" size="small" sx={{ background: '#fef3c7', color: '#92400e', fontSize: '0.7rem' }} />}
                        </TableCell>
                        <TableCell><Typography sx={{ fontSize: '0.875rem', color: '#0f172a', ...f }}>{t.client?.name || '—'}</Typography></TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.8rem', color: '#64748b', ...f }}>{toDateInput(t.start_date)}</Typography>
                        </TableCell>
                        <TableCell>
                          {t.price
                            ? <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#16a34a', ...f }}>R$ {Number(t.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Typography>
                            : <Typography sx={{ fontSize: '0.8rem', color: '#cbd5e1', ...f }}>—</Typography>}
                        </TableCell>
                        <TableCell><TripStatusChip status={t.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>

            <TripReportDialog open={reportOpen} onClose={() => setReportOpen(false)} trips={filteredTrips} />
          </Box>
        )}
      </Box>
    </Box>
  )
}
