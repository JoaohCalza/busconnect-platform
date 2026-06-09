import { useState, useEffect } from 'react'
import {
  Box, Typography, TextField, CircularProgress, InputAdornment,
  Card, CardContent, CardMedia, CardActions, Button, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel, Snackbar, Alert,
} from '@mui/material'
import { vehicleAPI, tripRequestAPI } from '../../services/api'

const fmtPrice = (val) => val != null && val !== ''
  ? Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  : null

const formatDateBR = (val) => {
  if (!val) return '?'
  const d = new Date(String(val).substring(0, 10) + 'T00:00:00')
  return d.toLocaleDateString('pt-BR')
}

const f = { fontFamily: '"Plus Jakarta Sans", sans-serif' }

const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px', background: '#fff', '& fieldset': { borderColor: '#e2e8f0' }, '&.Mui-focused fieldset': { borderColor: '#1a56db', borderWidth: '2px' } } }

// Label fixo acima do input — resolve o bug de sobreposição com placeholder nativo de date/time
function DateField({ label, type, value, onChange, min }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', ...f }}>
        {label}
      </Typography>
      <TextField
        size="small"
        type={type}
        value={value}
        onChange={onChange}
        fullWidth
        inputProps={min ? { min } : undefined}
        sx={inputSx}
      />
    </Box>
  )
}

const today = () => new Date().toISOString().split('T')[0]

function RequestDialog({ open, onClose, vehicle, user, onSuccess }) {
  const [form, setForm]                   = useState({ origin: '', destination: '', departure_date: '', departure_time: '08:00', passengers: 1, distance_km: '', notes: '' })
  const [saving, setSaving]               = useState(false)
  const [unavailable, setUnavailable]     = useState([])
  const [loadingDates, setLoadingDates]   = useState(false)
  const [apiError, setApiError]           = useState('')

  useEffect(() => {
    if (open) {
      setForm({ origin: '', destination: '', departure_date: '', departure_time: '08:00', passengers: 1, distance_km: '', notes: '' })
      setUnavailable([])
      setApiError('')
      if (vehicle?.id) {
        setLoadingDates(true)
        vehicleAPI.getUnavailableDates(vehicle.id)
          .then(data => setUnavailable(data))
          .catch(() => {})
          .finally(() => setLoadingDates(false))
      }
    }
  }, [open, vehicle?.id])

  const isConflict = (date) => {
    if (!date) return false
    return unavailable.some(t => {
      const start = t.start_date ? String(t.start_date).substring(0, 10) : null
      const end   = t.end_date   ? String(t.end_date).substring(0, 10)   : null
      if (!start) return false
      return end ? (date >= start && date <= end) : date === start
    })
  }

  const conflict = isConflict(form.departure_date)

  const exceedsCapacity =
  vehicle?.capacity &&
  Number(form.passengers) > Number(vehicle.capacity)

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await tripRequestAPI.create({
        client_id:      user.id,
        company_id:     vehicle.company_id,
        vehicle_id:     vehicle.id,
        origin:         form.origin,
        destination:    form.destination,
        departure_date: form.departure_date,
        departure_time: form.departure_time,
        passengers:     Number(form.passengers),
        distance_km:    form.distance_km !== '' ? Number(form.distance_km) : undefined,
        notes:          form.notes || undefined,
      })
      onSuccess()
      onClose()
    } catch (err) {
      const msg = err?.response?.data?.message || 'Erro ao enviar solicitação. Tente novamente.'
      setApiError(msg)
    } finally {
      setSaving(false)
    }
  }

  const valid = form.origin && form.destination && form.departure_date && form.passengers > 0

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: '16px', p: 1, minWidth: 480 } }}>
      <DialogTitle sx={{ fontWeight: 700, ...f }}>
        Solicitar viagem
        {vehicle && <Typography sx={{ fontSize: '0.8rem', color: '#64748b', mt: 0.5, ...f }}>{vehicle.brand} {vehicle.model} — {vehicle.company?.name}</Typography>}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Origem *" size="small" value={form.origin} onChange={set('origin')} fullWidth sx={inputSx} />
          <TextField label="Destino *" size="small" value={form.destination} onChange={set('destination')} fullWidth sx={inputSx} />

          {/* Data e Horário — label estático acima para evitar sobreposição com placeholder nativo */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <DateField label="Horário de saída *" type="time" value={form.departure_time} onChange={set('departure_time')} />
            <DateField label="Data de saída *"    type="date" value={form.departure_date} onChange={set('departure_date')} min={today()} />
          </Box>

          {/* Datas indisponíveis */}
          {loadingDates && form.departure_date && <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', ...f }}>Verificando disponibilidade...</Typography>}
          {!loadingDates && unavailable.length > 0 && form.departure_date && (
            <Box sx={{ background: '#fef9ec', border: '1px solid #fcd34d', borderRadius: '10px', px: 2, py: 1.5 }}>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400e', mb: 0.75, ...f }}>
                Datas já reservadas para este veículo:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                {unavailable.map((t, i) => (
                  <Typography key={i} sx={{ fontSize: '0.78rem', color: '#78350f', ...f }}>
                    • {formatDateBR(t.start_date)}{t.end_date && t.end_date !== t.start_date ? ` até ${formatDateBR(t.end_date)}` : ''}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}

          {/* Bloqueio se a data escolhida colide com viagem existente */}
          {conflict && (
            <Box sx={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', px: 2, py: 1.5 }}>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#dc2626', ...f }}>
                Este veículo já está reservado nessa data.
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#991b1b', mt: 0.25, ...f }}>
                Escolha outra data disponível para continuar.
              </Typography>
            </Box>
          )}

          <TextField label="Nº de passageiros *" size="small" type="number" value={form.passengers} onChange={set('passengers')} inputProps={{ min: 1, max: vehicle?.capacity || 99 }} fullWidth sx={inputSx} />

          {exceedsCapacity && (
          <Box
            sx={{
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '10px',
              px: 2,
              py: 1.5
            }}
          >
            <Typography
              sx={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#dc2626',
                ...f
              }}
            >
              Este ônibus suporta no máximo {vehicle.capacity} passageiros.
            </Typography>
          </Box>
        )}
          {/* Distância e preview de preço */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, alignItems: 'flex-end' }}>
            <TextField
              label="Distância estimada (km)"
              size="small"
              type="number"
              value={form.distance_km}
              onChange={set('distance_km')}
              inputProps={{ min: 1, step: '1' }}
              fullWidth
              sx={inputSx}
            />
            {vehicle?.price_per_km && form.distance_km > 0 ? (
              <Box sx={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', px: 2, py: 1.5 }}>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em', ...f }}>Valor estimado</Typography>
                <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#16a34a', ...f }}>
                  {(Number(vehicle.price_per_km) * Number(form.distance_km)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Typography>
              </Box>
            ) : vehicle?.price_per_km ? (
              <Box sx={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', px: 2, py: 1.5 }}>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', ...f }}>Tarifa</Typography>
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#64748b', ...f }}>
                  R$ {Number(vehicle.price_per_km).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/km
                </Typography>
              </Box>
            ) : null}
          </Box>

          <TextField label="Observações" size="small" multiline rows={3} fullWidth value={form.notes} onChange={set('notes')} sx={inputSx} />
        </Box>
      </DialogContent>
      {apiError && (
        <Box sx={{ px: 3, pb: 1 }}>
          <Box sx={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', px: 2, py: 1.5 }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#dc2626', ...f }}>{apiError}</Typography>
          </Box>
        </Box>
      )}
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} sx={{ color: '#64748b', fontWeight: 600, ...f }}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={saving || !valid || conflict || exceedsCapacity} variant="contained"
          sx={{ background: '#1a56db', fontWeight: 600, borderRadius: '10px', '&:hover': { background: '#1e3a8a' }, ...f }}>
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Enviar solicitação'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function DetailDialog({ open, onClose, vehicle, onRequest }) {
  if (!vehicle) return null
  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: '16px', p: 1, minWidth: 540 } }}>
      <DialogTitle sx={{ fontWeight: 700, ...f }}>Detalhes do veículo</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '4px !important' }}>
        {vehicle.image && (
          <Box component="img" src={vehicle.image} alt={`${vehicle.brand} ${vehicle.model}`}
            sx={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: '12px' }} />
        )}
        {vehicle.price_per_km && (
          <Box sx={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#166534', ...f }}>Tarifa</Typography>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a', ...f }}>
              R$ {Number(vehicle.price_per_km).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/km
            </Typography>
          </Box>
        )}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          {[
            ['Empresa', vehicle.company?.name],
            ['Cidade', `${vehicle.company?.city || '—'}, ${vehicle.company?.state || '—'}`],
            ['Marca', vehicle.brand],
            ['Modelo', vehicle.model],
            ['Ano', vehicle.year],
            ['Capacidade', `${vehicle.capacity} passageiros`],
          ].map(([label, value]) => (
            <Box key={label}>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', ...f }}>{label}</Typography>
              <Typography sx={{ fontSize: '0.875rem', color: '#0f172a', fontWeight: 500, ...f }}>{value}</Typography>
            </Box>
          ))}
          {vehicle.description && (
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', ...f }}>Descrição</Typography>
              <Typography sx={{ fontSize: '0.875rem', color: '#0f172a', ...f }}>{vehicle.description}</Typography>
            </Box>
          )}
          {(vehicle.company?.phone || vehicle.company?.email) && (
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', ...f }}>Contato da empresa</Typography>
              <Typography sx={{ fontSize: '0.875rem', color: '#0f172a', ...f }}>{vehicle.company?.phone} {vehicle.company?.email}</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} sx={{ color: '#64748b', fontWeight: 600, ...f }}>Fechar</Button>
        <Button onClick={onRequest} variant="contained"
          sx={{ background: '#1a56db', fontWeight: 600, borderRadius: '10px', '&:hover': { background: '#1e3a8a' }, ...f }}>
          Solicitar viagem
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default function BusCatalog({ user }) {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [detail, setDetail]     = useState(null)
  const [request, setRequest]   = useState(null)
  const [snack, setSnack]       = useState({ open: false, msg: '' })

  useEffect(() => {
    vehicleAPI.getCatalog().then(data => { setVehicles(data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const filtered = vehicles.filter(v => {
    const q = search.toLowerCase()
    return !q || v.brand.toLowerCase().includes(q) || v.model.toLowerCase().includes(q)
           || v.company?.name?.toLowerCase().includes(q) || v.company?.city?.toLowerCase().includes(q)
  })

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', mb: 0.5, ...f }}>Ônibus Disponíveis</Typography>
        <Typography sx={{ fontSize: '0.875rem', color: '#64748b', ...f }}>Encontre o veículo ideal e solicite sua viagem.</Typography>
      </Box>

      <TextField
        placeholder="Buscar por empresa, modelo, cidade..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        size="small"
        fullWidth
        sx={{ mb: 3, maxWidth: 480, ...inputSx }}
        InputProps={{
          startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: '1rem' }}>🔍</Typography></InputAdornment>
        }}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#1a56db' }} /></Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '2rem', mb: 1 }}>🚌</Typography>
          <Typography sx={{ fontSize: '0.875rem', color: '#94a3b8', ...f }}>Nenhum ônibus encontrado.</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
          {filtered.map(v => (
            <Card key={v.id} sx={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(15,23,42,0.06)', '&:hover': { boxShadow: '0 4px 20px rgba(15,23,42,0.12)', transform: 'translateY(-2px)' }, transition: 'all 0.2s' }}>
              {v.image ? (
                <CardMedia component="img" height="160" image={v.image} alt={`${v.brand} ${v.model}`} sx={{ objectFit: 'cover' }} />
              ) : (
                <Box sx={{ height: 160, background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ fontSize: '3rem' }}>🚌</Typography>
                </Box>
              )}
              <CardContent sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', ...f }}>{v.brand} {v.model}</Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: '#64748b', ...f }}>{v.company?.name}</Typography>
                  </Box>
                  <Chip label={`${v.capacity} pax`} size="small" sx={{ background: '#eff6ff', color: '#1a56db', fontWeight: 700, fontSize: '0.72rem' }} />
                </Box>
                {v.price_per_km && (
                  <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#16a34a', mb: 0.5, ...f }}>
                    R$ {Number(v.price_per_km).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/km
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                  {v.company?.city && <Chip label={`📍 ${v.company.city}, ${v.company.state}`} size="small" sx={{ background: '#f8fafc', color: '#64748b', fontSize: '0.72rem' }} />}
                  <Chip label={`${v.year}`} size="small" sx={{ background: '#f8fafc', color: '#64748b', fontSize: '0.72rem' }} />
                </Box>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
                <Button size="small" onClick={() => setDetail(v)} fullWidth
                  sx={{ border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: '0.8rem', borderRadius: '8px', '&:hover': { background: '#f8fafc' }, ...f }}>
                  Ver detalhes
                </Button>
                <Button size="small" onClick={() => setRequest(v)} fullWidth variant="contained"
                  sx={{ background: '#1a56db', fontWeight: 600, fontSize: '0.8rem', borderRadius: '8px', '&:hover': { background: '#1e3a8a' }, ...f }}>
                  Solicitar viagem
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      <DetailDialog
        open={!!detail}
        onClose={() => setDetail(null)}
        vehicle={detail}
        onRequest={() => { setRequest(detail); setDetail(null) }}
      />

      <RequestDialog
        open={!!request}
        onClose={() => setRequest(null)}
        vehicle={request}
        user={user}
        onSuccess={() => { setSnack({ open: true, msg: 'Solicitação enviada com sucesso!' }); setRequest(null) }}
      />

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ open: false, msg: '' })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" sx={{ borderRadius: '10px', fontWeight: 600, ...f }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  )
}
