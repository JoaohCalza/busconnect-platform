import { useState, useEffect } from 'react'
import { Box, Typography, TextField, Button } from '@mui/material'
import TopNavbar from "../components/ui/TopNavbar.jsx"
import { userAPI, companyAPI } from '../services/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const f = { fontFamily: '"Plus Jakarta Sans", sans-serif' }

const formatarCPF = (valor) => {
  const digitos = valor.replace(/\D/g, '').slice(0, 11)
  if (digitos.length <= 3) return digitos
  if (digitos.length <= 6) return `${digitos.slice(0,3)}.${digitos.slice(3)}`
  if (digitos.length <= 9) return `${digitos.slice(0,3)}.${digitos.slice(3,6)}.${digitos.slice(6)}`
  return `${digitos.slice(0,3)}.${digitos.slice(3,6)}.${digitos.slice(6,9)}-${digitos.slice(9)}`
}

function FieldRow({ label, value, editable, onChange }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', ...f }}>{label}</Typography>
      {editable
        ? <TextField size="small" value={value} onChange={e => onChange(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', background: '#f8fafc', fontSize: '0.9rem', '& fieldset': { borderColor: '#e2e8f0' }, '&:hover fieldset': { borderColor: '#93c5fd' }, '&.Mui-focused fieldset': { borderColor: '#1a56db', borderWidth: '2px' } } }} />
        : <Typography sx={{ fontSize: '0.9rem', color: value ? '#0f172a' : '#cbd5e1', fontWeight: 500, ...f }}>{value || '—'}</Typography>
      }
    </Box>
  )
}

function SectionCard({ title, badge, action, children }) {
  return (
    <Box sx={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}>
      <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', ...f }}>{title}</Typography>
          {badge}
        </Box>
        {action}
      </Box>
      {children}
    </Box>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CompanyUserDashboard({ user, onLogout }) {
  const [tab, setTab]         = useState('meu-perfil')
  const [editing, setEditing] = useState(false)
  const [saved, setSaved]     = useState(false)
  const [erro, setErro]       = useState('')
  const [profile, setProfile] = useState({
    name:  user?.name  || '',
    email: user?.email || '',
    phone: '',
    cpf:   '',
  })
  const [company, setCompany] = useState({
    company_id: user?.company_id || 0,
    name: '',
    email: '',
    phone: '',
    cnpj: '',
    address: '',
    status: '',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
  const loadData = async () => {
    try {
      // usa dados da prop diretamente, sem chamar o backend
      setProfile({
        name:  user?.name  || '',
        email: user?.email || '',
        phone: user?.phone || '',
        cpf:   user?.cpf ? formatarCPF(user.cpf) : '',
      })

      // empresa ainda busca do backend
      if (user?.company_id) {
        const companyData = await companyAPI.getCompany(user.company_id)
        if (companyData) setCompany(companyData)
      }
    } catch (error) {
      console.error('Falha ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }
  loadData()
  }, [user?.company_id])

  // Atualiza campo com máscara no CPF
  const setField = (key) => (val) => {
    if (key === 'cpf') val = formatarCPF(val)
    setProfile(prev => ({ ...prev, [key]: val }))
  }

  const handleSave = async () => {
    // Valida CPF se preenchido
    if (profile.cpf && profile.cpf.replace(/\D/g, '').length !== 11) {
      setErro('CPF incompleto. Preencha os 11 dígitos.')
      return
    }

    setErro('')
    try {
      await userAPI.updateProfile({
        name:  profile.name,
        email: profile.email,
        phone: profile.phone,
        cpf: (profile.cpf || '').replace(/\D/g, ''),
      })
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (error) {
      console.error('Falha ao salvar perfil:', error)
      setErro('Erro ao salvar. Tente novamente.')
    }
  }

  const handleCancelar = () => {
    setEditing(false)
    setErro('')
  }

  const navLinks = [
    { key: 'meu-perfil', label: '👤 Meu perfil'    },
    { key: 'empresa',    label: '🏢 Minha empresa' },
  ]

  const readonlyBadge = (
    <Box sx={{ px: 1.5, py: 0.4, borderRadius: '6px', background: '#f1f5f9' }}>
      <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, ...f }}>Somente leitura</Typography>
    </Box>
  )

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8fafc', ...f }}>
      <TopNavbar links={navLinks} activeTab={tab} onTab={setTab} userName={profile.name} onLogout={onLogout} />

      <Box sx={{ p: 4, maxWidth: 900, mx: 'auto' }}>
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', ...f }}>
            {tab === 'meu-perfil' && 'Meu perfil'}
            {tab === 'empresa'    && 'Minha empresa'}
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8', mt: 0.25, ...f }}>
            {company.name}
          </Typography>
        </Box>

        {/* ── Meu perfil ── */}
        {tab === 'meu-perfil' && (
          <SectionCard
            title="Dados pessoais"
            action={
              !editing
                ? <Button size="small" onClick={() => setEditing(true)} sx={{ background: '#eff6ff', color: '#1a56db', fontWeight: 600, fontSize: '0.8rem', px: 2, '&:hover': { background: '#dbeafe' } }}>✏️ Editar</Button>
                : <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" onClick={handleCancelar} sx={{ background: '#f1f5f9', color: '#64748b', fontWeight: 600, fontSize: '0.8rem', px: 2 }}>Cancelar</Button>
                    <Button size="small" onClick={handleSave} sx={{ background: '#1a56db', color: '#fff', fontWeight: 600, fontSize: '0.8rem', px: 2, '&:hover': { background: '#1e3a8a' } }}>{saved ? '✓ Salvo' : 'Salvar'}</Button>
                  </Box>
            }
          >
            <Box sx={{ p: 3, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
              <FieldRow label="Nome completo" value={profile.name}  editable={editing} onChange={setField('name')} />
              <FieldRow label="CPF"           value={profile.cpf}   editable={editing} onChange={setField('cpf')} />
              <FieldRow label="E-mail"        value={profile.email} editable={editing} onChange={setField('email')} />
              <FieldRow label="Telefone"      value={profile.phone} editable={editing} onChange={setField('phone')} />
            </Box>

            {/* Erro de validação */}
            {erro && (
              <Box sx={{ px: 3, pb: 2 }}>
                <Typography sx={{ fontSize: '0.8rem', color: '#dc2626', ...f }}>{erro}</Typography>
              </Box>
            )}
          </SectionCard>
        )}

        {/* ── Empresa (somente leitura) ── */}
        {tab === 'empresa' && (
          <SectionCard title="Dados da empresa" badge={readonlyBadge}>
            <Box sx={{ p: 3, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
              <FieldRow label="Nome da empresa" value={company.name}    editable={false} onChange={() => {}} />
              <FieldRow label="CNPJ"            value={company.cnpj}    editable={false} onChange={() => {}} />
              <FieldRow label="E-mail"          value={company.email}   editable={false} onChange={() => {}} />
              <FieldRow label="Telefone"        value={company.phone}   editable={false} onChange={() => {}} />
              <Box sx={{ gridColumn: '1 / -1' }}>
                <FieldRow label="Endereço"      value={company.address} editable={false} onChange={() => {}} />
              </Box>
            </Box>
          </SectionCard>
        )}
      </Box>
    </Box>
  )
}