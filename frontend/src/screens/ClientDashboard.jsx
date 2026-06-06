import { useState, useEffect } from 'react'
import { Box, Typography, TextField, Button } from '@mui/material'
import TopNavbar  from '../components/ui/TopNavbar.jsx'
import { userAPI } from '../services/api'
import BusCatalog  from './client/BusCatalog.jsx'
import MyRequests  from './client/MyRequests.jsx'
import MyTrips     from './client/MyTrips.jsx'

const f = { fontFamily: '"Plus Jakarta Sans", sans-serif' }

const formatarCPF = (valor) => {
  const d = valor.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`
}

function FieldRow({ label, value, editable, onChange }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', ...f }}>{label}</Typography>
      {editable
        ? <TextField size="small" value={value} onChange={e => onChange(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', background: '#f8fafc', fontSize: '0.9rem', '& fieldset': { borderColor: '#e2e8f0' }, '&:hover fieldset': { borderColor: '#93c5fd' }, '&.Mui-focused fieldset': { borderColor: '#1a56db', borderWidth: '2px' } } }} />
        : <Typography sx={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 500, ...f }}>{value || '—'}</Typography>
      }
    </Box>
  )
}

export default function ClientDashboard({ user, onLogout }) {
  const [tab, setTab]         = useState('catalogo')
  const [editing, setEditing] = useState(false)
  const [saved, setSaved]     = useState(false)
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', cpf: user?.cpf || '' })

  useEffect(() => {
    userAPI.getProfile()
      .then(data => setProfile({ name: data.name, email: data.email, phone: data.phone || '', cpf: data.cpf ? formatarCPF(data.cpf) : '' }))
      .catch(console.error)
  }, [])

  const setField = (key) => (val) => {
    if (key === 'cpf') val = formatarCPF(val)
    setProfile(prev => ({ ...prev, [key]: val }))
  }

  const handleSave = async () => {
    try {
      await userAPI.updateProfile({ name: profile.name, email: profile.email, phone: profile.phone, cpf: (profile.cpf || '').replace(/\D/g, '') })
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  const navLinks = [
    { key: 'catalogo',     label: 'Ônibus disponíveis' },
    { key: 'solicitacoes', label: 'Minhas solicitações' },
    { key: 'viagens',      label: 'Minhas viagens' },
    { key: 'perfil',       label: 'Meu perfil' },
  ]

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8fafc', ...f }}>
      <TopNavbar links={navLinks} activeTab={tab} onTab={setTab} userName={profile.name} onLogout={onLogout} />

      <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>

        {tab === 'catalogo'     && <BusCatalog user={user} />}
        {tab === 'solicitacoes' && <MyRequests user={user} />}
        {tab === 'viagens'      && <MyTrips user={user} />}

        {tab === 'perfil' && (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', ...f }}>Meu perfil</Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8', mt: 0.25, ...f }}>Gerencie seus dados pessoais</Typography>
            </Box>

            <Box sx={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}>
              <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', ...f }}>Dados pessoais</Typography>
                {!editing
                  ? <Button size="small" onClick={() => setEditing(true)} sx={{ background: '#eff6ff', color: '#1a56db', fontWeight: 600, fontSize: '0.8rem', px: 2, '&:hover': { background: '#dbeafe' } }}>✏️ Editar</Button>
                  : <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" onClick={() => setEditing(false)} sx={{ background: '#f1f5f9', color: '#64748b', fontWeight: 600, fontSize: '0.8rem', px: 2 }}>Cancelar</Button>
                      <Button size="small" onClick={handleSave} sx={{ background: '#1a56db', color: '#fff', fontWeight: 600, fontSize: '0.8rem', px: 2, '&:hover': { background: '#1e3a8a' } }}>{saved ? '✓ Salvo' : 'Salvar'}</Button>
                    </Box>
                }
              </Box>
              <Box sx={{ p: 3, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                <FieldRow label="Nome completo" value={profile.name}  editable={editing} onChange={setField('name')} />
                <FieldRow label="CPF"           value={profile.cpf}   editable={editing} onChange={setField('cpf')} />
                <FieldRow label="E-mail"        value={profile.email} editable={editing} onChange={setField('email')} />
                <FieldRow label="Telefone"      value={profile.phone} editable={editing} onChange={setField('phone')} />
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Box>
  )
}
