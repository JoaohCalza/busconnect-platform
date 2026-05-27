import { useState, useEffect } from 'react'
import {
  Box, Typography, Avatar, Button, Chip, TextField,
  Table, TableBody, TableCell, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material'
import TopNavbar from "../components/ui/TopNavbar.jsx"
import { companyAPI } from '../services/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const f = { fontFamily: '"Plus Jakarta Sans", sans-serif' }

function FieldRow({ label, value, editable, onChange }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', ...f }}>{label}</Typography>
      {editable
        ? <TextField size="small" value={value} onChange={e => onChange(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', background: '#f8fafc', fontSize: '0.9rem', '& fieldset': { borderColor: '#e2e8f0' }, '&:hover fieldset': { borderColor: '#93c5fd' }, '&.Mui-focused fieldset': { borderColor: '#1a56db', borderWidth: '2px' } } }} />
        : <Typography sx={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 500, ...f }}>{value}</Typography>
      }
    </Box>
  )
}

function SectionCard({ title, action, children }) {
  return (
    <Box sx={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}>
      <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', ...f }}>{title}</Typography>
        {action}
      </Box>
      {children}
    </Box>
  )
}

function StatusBanner({ status }) {
  const map = {
    1: { label: 'Aguardando aprovação — sua conta está em análise pelo administrador.', bg: '#fef3c7', color: '#92400e', icon: '⏳' },
    2: { label: 'Conta rejeitada — entre em contato com o administrador.',              bg: '#fee2e2', color: '#991b1b', icon: '❌' },
  }

  const s = map[Number(status)]

  if (!s) return null

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, background: s.bg, border: `1px solid ${s.color}22`, borderRadius: '12px', px: 3, py: 2, mb: 3 }}>
      <Typography sx={{ fontSize: '1.2rem' }}>{s.icon}</Typography>
      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: s.color, ...f }}>{s.label}</Typography>
    </Box>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CompanyDashboard({ user, onLogout }) {
  const [tab, setTab]         = useState('perfil')
  const [editing, setEditing] = useState(false)
  const [fields, setFields]   = useState({
    company_id: user?.company_id || 0,
    name: '',
    email: '',
    phone: '',
    cnpj: '',
    address: '',
    active: '',
  })
  const [saved, setSaved]     = useState(false)
  const [users, setUsers]     = useState([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: '' })
  const [deleteId, setDeleteId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
          console.log('user:', user)                          // ← adiciona
    console.log('company_id:', user?.company_id)        // ← adiciona
      if (!user?.company_id) return
      try {
        const [companyData, usersData] = await Promise.all([
          companyAPI.getCompany(user.company_id),
          companyAPI.getUsers(user.company_id),
        ])
        setFields(companyData)
        setUsers(usersData)
      } catch (error) {
        console.error('Failed to load company data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user?.company_id])

  const setField = (key) => (val) => setFields(prev => ({ ...prev, [key]: val }))

  const handleSave = async () => {
    try {
      await companyAPI.updateCompany(user.company_id, {
        name: fields.name,
        email: fields.email,
        phone: fields.phone,
        address: fields.address,
      })
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (error) {
      console.error('Failed to update company:', error)
    }
  }

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) return
    try {
      await companyAPI.addUser({
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        account_type: 'FUNCIONARIO',
        company_id: user.company_id,
      })
      const usersData = await companyAPI.getUsers(user.company_id)
      setUsers(usersData)
      setNewUser({ name: '', email: '', password: '', role: '' })
      setDialogOpen(false)
    } catch (error) {
      console.error('Falha ao adicionar usuário:', error)
    }
  }

  const handleDeleteUser = async (id) => {
  try {
    await companyAPI.removeUser(id)  // ← só o id do usuário a remover
    setUsers(prev => prev.filter(u => u.id !== id))
    setDeleteId(null)
  } catch (error) {
    console.error('Failed to remove user:', error)
  }
  }

  const navLinks = [
    { key: 'perfil',   label: '🏢 Gerenciamento' },
    { key: 'usuarios', label: '👥 Usuários' },
  ]

  const thStyle = { color: '#94a3b8', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', py: 1.5, ...f }
  const tdStyle = { borderBottom: '1px solid #f8fafc', py: 2 }

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8fafc', ...f }}>
      <TopNavbar links={navLinks} activeTab={tab} onTab={setTab} userName={user?.name || 'Empresa'} onLogout={onLogout} />

      <Box sx={{ p: 4, maxWidth: 1100, mx: 'auto' }}>
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', ...f }}>
            {tab === 'perfil'   && 'Perfil da empresa'}
            {tab === 'usuarios' && 'Usuários da empresa'}
          </Typography>
        </Box>

        <StatusBanner status={fields.active} />

        {/* ── Perfil ── */}
        {tab === 'perfil' && (
          <SectionCard
            title="Dados cadastrais"
            action={
              !editing
                ? <Button size="small" onClick={() => setEditing(true)} sx={{ background: '#eff6ff', color: '#1a56db', fontWeight: 600, fontSize: '0.8rem', px: 2, '&:hover': { background: '#dbeafe' } }}>✏️ Editar</Button>
                : <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" onClick={() => setEditing(false)} sx={{ background: '#f1f5f9', color: '#64748b', fontWeight: 600, fontSize: '0.8rem', px: 2 }}>Cancelar</Button>
                    <Button size="small" onClick={handleSave} sx={{ background: '#1a56db', color: '#fff', fontWeight: 600, fontSize: '0.8rem', px: 2, '&:hover': { background: '#1e3a8a' } }}>{saved ? '✓ Salvo' : 'Salvar'}</Button>
                  </Box>
            }
          >
            <Box sx={{ p: 3, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
              <FieldRow label="Nome da empresa" value={fields.name}    editable={editing} onChange={setField('name')} />
              <FieldRow label="CNPJ"            value={fields.cnpj}    editable={false}   onChange={() => {}} />
              <FieldRow label="E-mail"          value={fields.email}   editable={editing} onChange={setField('email')} />
              <FieldRow label="Telefone"        value={fields.phone}   editable={editing} onChange={setField('phone')} />
              <Box sx={{ gridColumn: '1 / -1' }}>
                <FieldRow label="Endereço"      value={fields.address} editable={editing} onChange={setField('address')} />
              </Box>
            </Box>
          </SectionCard>
        )}

        {/* ── Usuários da empresa ── */}
        {tab === 'usuarios' && (
          <SectionCard
            title={`Usuários associados (${users.length})`}
            action={
              <Button
                size="small"
                onClick={() => setDialogOpen(true)}
                sx={{ background: '#1a56db', color: '#fff', fontWeight: 600, fontSize: '0.8rem', px: 2, '&:hover': { background: '#1e3a8a' } }}
              >
                + Adicionar usuário
              </Button>
            }
          >
            {users.length === 0
              ? <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '0.875rem', color: '#94a3b8', ...f }}>Nenhum usuário associado ainda.</Typography>
                </Box>
              : <Table>
                  <TableHead>
                    <TableRow sx={{ '& th': thStyle }}>
                      <TableCell>Nome</TableCell>
                      <TableCell>E-mail</TableCell>
                      <TableCell>Função</TableCell>
                      <TableCell align="right">Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map(u => (
                      <TableRow key={u.id} sx={{ '& td': tdStyle, '&:last-child td': { borderBottom: 0 } }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 32, height: 32, background: '#e0e7ff', color: '#3730a3', fontSize: '0.75rem', fontWeight: 700 }}>{u.name.charAt(0)}</Avatar>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', ...f }}>{u.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell><Typography sx={{ fontSize: '0.875rem', color: '#64748b', ...f }}>{u.email}</Typography></TableCell>
                        <TableCell>
                          {u.role
                            ? <Chip label={u.role} size="small" sx={{ background: '#f0fdf4', color: '#166534', fontWeight: 600, fontSize: '0.75rem' }} />
                            : <Typography sx={{ fontSize: '0.75rem', color: '#cbd5e1', ...f }}>—</Typography>
                          }
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            onClick={() => setDeleteId(u.id)}
                            sx={{ border: '1px solid #fca5a5', color: '#dc2626', fontSize: '0.75rem', px: 1.5, minWidth: 0, '&:hover': { background: '#fef2f2' } }}
                          >
                            Remover
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            }
          </SectionCard>
        )}
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} PaperProps={{ sx: { borderRadius: '16px', p: 1, minWidth: 380 } }}>
        <DialogTitle sx={{ fontWeight: 700, ...f }}>Adicionar usuário</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField
            label="Nome completo" size="small" fullWidth
            value={newUser.name}
            onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', background: '#f8fafc', '& fieldset': { borderColor: '#e2e8f0' }, '&.Mui-focused fieldset': { borderColor: '#1a56db', borderWidth: '2px' } } }}
          />
          <TextField
            label="E-mail" size="small" fullWidth type="email"
            value={newUser.email}
            onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', background: '#f8fafc', '& fieldset': { borderColor: '#e2e8f0' }, '&.Mui-focused fieldset': { borderColor: '#1a56db', borderWidth: '2px' } } }}
          />
          <TextField
            label="Senha" size="small" fullWidth type="password"
            value={newUser.password}
            onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
            helperText="Mín. 8 caracteres"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', background: '#f8fafc', '& fieldset': { borderColor: '#e2e8f0' }, '&.Mui-focused fieldset': { borderColor: '#1a56db', borderWidth: '2px' } } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: '#64748b', fontWeight: 600, ...f }}>Cancelar</Button>
          <Button
            onClick={handleAddUser}
            disabled={!newUser.name || !newUser.email || !newUser.password}
            variant="contained"
            sx={{ background: '#1a56db', fontWeight: 600, borderRadius: '10px', '&:hover': { background: '#1e3a8a' }, '&:disabled': { opacity: 0.5 }, ...f }}
          >
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: confirmar remoção ── */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} PaperProps={{ sx: { borderRadius: '16px', p: 1, minWidth: 340 } }}>
        <DialogTitle sx={{ fontWeight: 700, ...f }}>Remover usuário</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.875rem', color: '#64748b', ...f }}>Tem certeza que deseja remover este usuário da empresa?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setDeleteId(null)} sx={{ color: '#64748b', fontWeight: 600, ...f }}>Cancelar</Button>
          <Button onClick={() => handleDeleteUser(deleteId)} sx={{ background: '#fee2e2', color: '#dc2626', fontWeight: 600, borderRadius: '10px', '&:hover': { background: '#fecaca' }, ...f }}>Remover</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}