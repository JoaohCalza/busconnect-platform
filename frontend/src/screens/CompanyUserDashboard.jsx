import { useState, useEffect } from 'react'
import { Box, Typography, TextField, Button, CircularProgress } from '@mui/material'
import TopNavbar from '../components/ui/TopNavbar.jsx'
import { userAPI, companyAPI } from '../services/api'
import Vehicles         from './company/Vehicles.jsx'
import Drivers          from './company/Drivers.jsx'
import ReceivedRequests from './company/ReceivedRequests.jsx'
import CompanyTrips     from './company/Trips.jsx'

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

export default function CompanyUserDashboard({ user, onLogout }) {
  const [tab, setTab]         = useState('empresa')
  const [editing, setEditing] = useState(false)
  const [saved, setSaved]     = useState(false)
  const [erro, setErro]       = useState('')
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '', phone: '', cpf: '' })
  const [company, setCompany] = useState({ company_id: user?.company_id || 0, name: '', email: '', phone: '', cnpj: '', address: '', active: '' })

  useEffect(() => {
    const loadData = async () => {
      setProfile({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', cpf: user?.cpf ? formatarCPF(user.cpf) : '' })
      if (user?.company_id) {
        try {
          const companyData = await companyAPI.getCompany(user.company_id)
          if (companyData) setCompany(companyData)
        } catch (error) {
          console.error('Falha ao carregar empresa:', error)
        }
      }
      setLoading(false)
    }
    loadData()
  }, [user?.company_id])

  const setField = (key) => (val) => {
    if (key === 'cpf') val = formatarCPF(val)
    setProfile(prev => ({ ...prev, [key]: val }))
  }

  const handleSave = async () => {
    if (profile.cpf && profile.cpf.replace(/\D/g, '').length !== 11) {
      setErro('CPF incompleto. Preencha os 11 dígitos.')
      return
    }
    setErro('')
    try {
      await userAPI.updateProfile({ name: profile.name, email: profile.email, phone: profile.phone, cpf: (profile.cpf || '').replace(/\D/g, '') })
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (error) {
      setErro('Erro ao salvar. Tente novamente.')
    }
  }

  const isApproved = Number(company.active) === 3
  const activeTab  = isApproved ? tab : 'empresa'

  const navLinks = isApproved ? [
    { key: 'empresa',      label: 'Minha empresa' },
    { key: 'veiculos',     label: 'Veículos' },
    { key: 'motoristas',   label: 'Motoristas' },
    { key: 'solicitacoes', label: 'Solicitações' },
    { key: 'viagens',      label: 'Viagens' },
    { key: 'meu-perfil',   label: 'Meu perfil' },
  ] : []

  const readonlyBadge = (
    <Box sx={{ px: 1.5, py: 0.4, borderRadius: '6px', background: '#f1f5f9' }}>
      <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, ...f }}>Somente leitura</Typography>
    </Box>
  )

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <CircularProgress sx={{ color: '#1a56db' }} />
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8fafc', ...f }}>
      <TopNavbar links={navLinks} activeTab={activeTab} onTab={setTab} userName={profile.name} onLogout={onLogout} />

      <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>

        {activeTab === 'veiculos'     && <Vehicles companyId={user?.company_id} companyStatus={company.active} />}
        {activeTab === 'motoristas'   && <Drivers companyId={user?.company_id} />}
        {activeTab === 'solicitacoes' && <ReceivedRequests companyId={user?.company_id} />}
        {activeTab === 'viagens'      && <CompanyTrips companyId={user?.company_id} />}

        {(activeTab === 'meu-perfil' || activeTab === 'empresa') && (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', ...f }}>
                {activeTab === 'meu-perfil' ? 'Meu perfil' : 'Minha empresa'}
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8', mt: 0.25, ...f }}>{company.name}</Typography>
            </Box>

            {!isApproved && (
              <Box sx={{ mb: 3, p: 3, borderRadius: '12px', background: Number(company.active) === 2 ? '#fef2f2' : '#fffbeb', border: `1px solid ${Number(company.active) === 2 ? '#fecaca' : '#fde68a'}`, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: Number(company.active) === 2 ? '#991b1b' : '#92400e', mb: 0.5, ...f }}>
                    {Number(company.active) === 2 ? 'Cadastro recusado' : 'Aguardando aprovação'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.85rem', color: Number(company.active) === 2 ? '#b91c1c' : '#a16207', ...f }}>
                    {Number(company.active) === 2
                      ? 'O cadastro da sua empresa foi recusado pelo administrador. Entre em contato para mais informações.'
                      : 'A empresa está em análise. Assim que o administrador aprovar, você terá acesso completo ao painel.'}
                  </Typography>
                </Box>
              </Box>
            )}

            {activeTab === 'meu-perfil' && (
              <SectionCard
                title="Dados pessoais"
                action={
                  !editing
                    ? <Button size="small" onClick={() => setEditing(true)} sx={{ background: '#eff6ff', color: '#1a56db', fontWeight: 600, fontSize: '0.8rem', px: 2, '&:hover': { background: '#dbeafe' } }}>✏️ Editar</Button>
                    : <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" onClick={() => { setEditing(false); setErro('') }} sx={{ background: '#f1f5f9', color: '#64748b', fontWeight: 600, fontSize: '0.8rem', px: 2 }}>Cancelar</Button>
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
                {erro && <Box sx={{ px: 3, pb: 2 }}><Typography sx={{ fontSize: '0.8rem', color: '#dc2626', ...f }}>{erro}</Typography></Box>}
              </SectionCard>
            )}

            {activeTab === 'empresa' && (
              <SectionCard title="Dados da empresa" badge={readonlyBadge}>
                <Box sx={{ p: 3, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                  <FieldRow label="Nome da empresa" value={company.name}    editable={false} onChange={() => {}} />
                  <FieldRow label="CNPJ"            value={company.cnpj}    editable={false} onChange={() => {}} />
                  <FieldRow label="E-mail"          value={company.email}   editable={false} onChange={() => {}} />
                  <FieldRow label="Telefone"        value={company.phone}   editable={false} onChange={() => {}} />
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <FieldRow label="Endereço" value={company.address} editable={false} onChange={() => {}} />
                  </Box>
                </Box>
              </SectionCard>
            )}
          </>
        )}
      </Box>
    </Box>
  )
}
