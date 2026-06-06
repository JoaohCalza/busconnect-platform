import { useState, useEffect } from 'react'
import {
  Box, Typography, Button, Chip, CircularProgress, Snackbar, Alert,
  Table, TableBody, TableCell, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel,
} from '@mui/material'
import { tripRequestAPI, vehicleAPI, driverAPI } from '../../services/api'

const f = { fontFamily: '"Plus Jakarta Sans", sans-serif' }

const formatDate = (val) => {
  if (!val) return '—'
  const d = new Date(String(val).substring(0, 10) + 'T00:00:00')
  return d.toLocaleDateString('pt-BR')
}

const thStyle = { color: '#94a3b8', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', py: 1.5, ...f }
const tdStyle = { borderBottom: '1px solid #f8fafc', py: 1.5 }

const STATUS_MAP = {
  pending:   { label: 'Pendente',  bg: '#fef3c7', color: '#92400e' },
  accepted:  { label: 'Aceita',    bg: '#f0fdf4', color: '#166534' },
  rejected:  { label: 'Recusada', bg: '#fee2e2', color: '#991b1b' },
  cancelled: { label: 'Cancelada', bg: '#f8fafc', color: '#64748b' },
}

function StatusChip({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.pending
  return <Chip label={s.label} size="small" sx={{ background: s.bg, color: s.color, fontWeight: 600, fontSize: '0.72rem' }} />
}

function DetailDialog({ open, onClose, request, vehicles, drivers, onStatusChange }) {
  const [action, setAction] = useState(null)  // 'accept' | 'reject'
  const [driverId, setDriverId] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setAction(null)
      setDriverId('')
      setVehicleId(request?.vehicle_id ? String(request.vehicle_id) : '')
    }
  }, [open])

  if (!request) return null

  // Calcula o preço previsto: price_per_km do veículo × distance_km da solicitação
  const selectedVehicle = vehicleId
    ? vehicles.find(v => String(v.id) === String(vehicleId))
    : request.vehicle
  const estimatedPrice = selectedVehicle?.price_per_km && request.distance_km
    ? Number(selectedVehicle.price_per_km) * Number(request.distance_km)
    : null

  const handleAccept = async () => {
    setSaving(true)
    try {
      await tripRequestAPI.updateStatus(request.id, {
        status:     'accepted',
        driver_id:  driverId  || undefined,
        vehicle_id: vehicleId || undefined,
      })
      onStatusChange()
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleReject = async () => {
    setSaving(true)
    try {
      await tripRequestAPI.updateStatus(request.id, { status: 'rejected' })
      onStatusChange()
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const selectSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px', background: '#f8fafc', '& fieldset': { borderColor: '#e2e8f0' }, '&.Mui-focused fieldset': { borderColor: '#1a56db', borderWidth: '2px' } } }

  const Row = ({ label, value }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', ...f }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.875rem', color: '#0f172a', fontWeight: 500, ...f }}>{value || '—'}</Typography>
    </Box>
  )

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: '16px', p: 1, minWidth: 520 } }}>
      <DialogTitle sx={{ fontWeight: 700, ...f }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Detalhes da solicitação #{request.id}
          <StatusChip status={request.status} />
        </Box>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '8px !important' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <Row label="Cliente" value={request.client?.name} />
          <Row label="Contato" value={request.client?.phone || request.client?.email} />
          <Row label="Origem" value={request.origin} />
          <Row label="Destino" value={request.destination} />
          <Row label="Data de saída" value={formatDate(request.departure_date)} />
          <Row label="Horário" value={request.departure_time} />
          <Row label="Passageiros" value={request.passengers} />
          {request.distance_km && <Row label="Distância" value={`${Number(request.distance_km)} km`} />}
          {request.notes && <Box sx={{ gridColumn: '1 / -1' }}><Row label="Observações" value={request.notes} /></Box>}
        </Box>

        {request.status === 'pending' && (
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Button onClick={() => setAction('accept')} variant="contained"
              sx={{ background: '#1a56db', fontWeight: 600, borderRadius: '10px', flex: 1, '&:hover': { background: '#1e3a8a' }, ...f }}>
              Aceitar
            </Button>
            <Button onClick={() => setAction('reject')}
              sx={{ border: '1px solid #fca5a5', color: '#dc2626', fontWeight: 600, borderRadius: '10px', flex: 1, '&:hover': { background: '#fef2f2' }, ...f }}>
              Recusar
            </Button>
          </Box>
        )}

        {action === 'accept' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, background: '#f8fafc', borderRadius: '12px', p: 2 }}>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', ...f }}>Vincular recursos</Typography>

            <FormControl size="small" fullWidth sx={selectSx}>
              <InputLabel sx={{ ...f }}>Veículo (opcional)</InputLabel>
              <Select label="Veículo (opcional)" value={vehicleId} onChange={e => setVehicleId(e.target.value)} sx={{ borderRadius: '10px', ...f }}>
                <MenuItem value=""><em>Nenhum por enquanto</em></MenuItem>
                {vehicles.filter(v => v.active).map(v => (
                  <MenuItem key={v.id} value={String(v.id)} sx={f}>
                    {v.brand} {v.model} — {v.plate}
                    {v.price_per_km ? ` (R$ ${Number(v.price_per_km).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/km)` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth sx={selectSx}>
              <InputLabel sx={{ ...f }}>Motorista (opcional)</InputLabel>
              <Select label="Motorista (opcional)" value={driverId} onChange={e => setDriverId(e.target.value)} sx={{ borderRadius: '10px', ...f }}>
                <MenuItem value=""><em>Nenhum por enquanto</em></MenuItem>
                {drivers.filter(d => d.active).map(d => <MenuItem key={d.id} value={d.id} sx={f}>{d.name}</MenuItem>)}
              </Select>
            </FormControl>

            {/* Valor calculado automaticamente */}
            {estimatedPrice != null ? (
              <Box sx={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', px: 2, py: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                <Typography sx={{ fontSize: '0.8rem', color: '#166534', ...f }}>
                  Valor estimado — R$ {Number(selectedVehicle.price_per_km).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/km × {Number(request.distance_km)} km
                </Typography>
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#16a34a', whiteSpace: 'nowrap', ...f }}>
                  {estimatedPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', px: 2, py: 1.5 }}>
                <Typography sx={{ fontSize: '0.78rem', color: '#92400e', ...f }}>
                  {!request.distance_km
                    ? 'O cliente não informou a distância — o valor da viagem não será calculado automaticamente.'
                    : 'Selecione um veículo com tarifa por km para calcular o valor automaticamente.'}
                </Typography>
              </Box>
            )}

            <Button onClick={handleAccept} disabled={saving} variant="contained"
              sx={{ background: '#16a34a', fontWeight: 600, borderRadius: '10px', '&:hover': { background: '#15803d' }, '&:disabled': { opacity: 0.5 }, ...f }}>
              {saving ? <CircularProgress size={18} color="inherit" /> : 'Confirmar aceitação'}
            </Button>
          </Box>
        )}

        {action === 'reject' && (
          <Box sx={{ background: '#fef2f2', borderRadius: '12px', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography sx={{ fontSize: '0.875rem', color: '#991b1b', fontWeight: 600, ...f }}>Confirma a recusa desta solicitação?</Typography>
            <Button onClick={handleReject} disabled={saving}
              sx={{ background: '#dc2626', color: '#fff', fontWeight: 600, borderRadius: '10px', '&:hover': { background: '#b91c1c' }, ...f }}>
              {saving ? <CircularProgress size={18} color="inherit" /> : 'Confirmar recusa'}
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ color: '#64748b', fontWeight: 600, ...f }}>Fechar</Button>
      </DialogActions>
    </Dialog>
  )
}

export default function ReceivedRequests({ companyId }) {
  const [requests, setRequests]   = useState([])
  const [vehicles, setVehicles]   = useState([])
  const [drivers, setDrivers]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(null)
  const [filter, setFilter]       = useState('all')
  const [snack, setSnack]         = useState({ open: false, msg: '', severity: 'success' })

  const load = async () => {
    try {
      const [reqs, vehs, drvs] = await Promise.all([
        tripRequestAPI.getByCompany(companyId),
        vehicleAPI.getByCompany(companyId),
        driverAPI.getByCompany(companyId),
      ])
      setRequests(reqs)
      setVehicles(vehs)
      setDrivers(drvs)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (companyId) load() }, [companyId])

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', ...f }}>Solicitações Recebidas</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {['all', 'pending', 'accepted', 'rejected', 'cancelled'].map(s => (
            <Button key={s} size="small" onClick={() => setFilter(s)}
              sx={{ fontWeight: 600, fontSize: '0.78rem', borderRadius: '8px', px: 1.5,
                background: filter === s ? '#1a56db' : '#f1f5f9',
                color: filter === s ? '#fff' : '#64748b',
                '&:hover': { background: filter === s ? '#1e3a8a' : '#e2e8f0' }, ...f }}>
              {s === 'all' ? 'Todas' : STATUS_MAP[s]?.label}
            </Button>
          ))}
        </Box>
      </Box>

      <Box sx={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: '#1a56db' }} /></Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.875rem', color: '#94a3b8', ...f }}>Nenhuma solicitação encontrada.</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': thStyle }}>
                <TableCell>#</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Origem → Destino</TableCell>
                <TableCell>Data</TableCell>
                <TableCell>Pax</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id} sx={{ '& td': tdStyle, '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell><Typography sx={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace' }}>#{r.id}</Typography></TableCell>
                  <TableCell><Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', ...f }}>{r.client?.name || '—'}</Typography></TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '0.8rem', color: '#0f172a', ...f }}>{r.origin}</Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', ...f }}>→ {r.destination}</Typography>
                  </TableCell>
                  <TableCell><Typography sx={{ fontSize: '0.8rem', color: '#64748b', ...f }}>{formatDate(r.departure_date)}</Typography></TableCell>
                  <TableCell><Typography sx={{ fontSize: '0.8rem', color: '#64748b', ...f }}>{r.passengers}</Typography></TableCell>
                  <TableCell><StatusChip status={r.status} /></TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => setSelected(r)}
                      sx={{ border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', px: 1.5, '&:hover': { background: '#f8fafc' } }}>
                      Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>

      <DetailDialog
        open={!!selected}
        onClose={() => setSelected(null)}
        request={selected}
        vehicles={vehicles}
        drivers={drivers}
        onStatusChange={() => { load(); setSnack({ open: true, msg: 'Solicitação atualizada.', severity: 'success' }) }}
      />

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} sx={{ borderRadius: '10px', fontWeight: 600, ...f }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  )
}
