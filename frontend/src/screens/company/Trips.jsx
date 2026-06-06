import { useState, useEffect } from 'react'
import {
  Box, Typography, Button, Chip, CircularProgress, Snackbar, Alert,
  Table, TableBody, TableCell, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel,
} from '@mui/material'
import { tripAPI, vehicleAPI, driverAPI } from '../../services/api'

const f = { fontFamily: '"Plus Jakarta Sans", sans-serif' }
const thStyle = { color: '#94a3b8', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', py: 1.5, ...f }
const tdStyle = { borderBottom: '1px solid #f8fafc', py: 1.5 }
const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px', background: '#f8fafc', '& fieldset': { borderColor: '#e2e8f0' }, '&.Mui-focused fieldset': { borderColor: '#1a56db', borderWidth: '2px' } } }
const selectSx = { borderRadius: '10px', background: '#f8fafc', '& fieldset': { borderColor: '#e2e8f0' }, '&.Mui-focused fieldset': { borderColor: '#1a56db', borderWidth: '2px' } }

// Label fixo acima — resolve sobreposição com placeholder nativo de date inputs
function DateField({ label, value, onChange }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', ...f }}>
        {label}
      </Typography>
      <TextField
        size="small"
        type="date"
        value={value || ''}
        onChange={onChange}
        fullWidth
        sx={inputSx}
      />
    </Box>
  )
}

const STATUS_MAP = {
  scheduled:   { label: 'Agendada',     bg: '#eff6ff', color: '#1a56db' },
  in_progress: { label: 'Em andamento', bg: '#fef3c7', color: '#92400e' },
  completed:   { label: 'Concluída',    bg: '#f0fdf4', color: '#166534' },
  cancelled:   { label: 'Cancelada',    bg: '#fee2e2', color: '#991b1b' },
}

function StatusChip({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.scheduled
  return <Chip label={s.label} size="small" sx={{ background: s.bg, color: s.color, fontWeight: 600, fontSize: '0.72rem' }} />
}

// Garante formato YYYY-MM-DD para inputs type="date"
const toDateInput = (val) => {
  if (!val) return ''
  return String(val).substring(0, 10)
}

const downloadCSV = (rows, filename) => {
  const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function EditTripDialog({ open, onClose, onSave, trip, vehicles, drivers }) {
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!trip) return
    setForm({
      vehicle_id:   trip.vehicle_id   || '',
      driver_id:    trip.driver_id    || '',
      start_date:   toDateInput(trip.start_date),
      end_date:     toDateInput(trip.end_date),
      price:        trip.price        || '',
      observations: trip.observations || '',
      status:       trip.status       || 'scheduled',
    })
  }, [trip, open])

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await tripAPI.update(trip.id, {
        vehicle_id:   form.vehicle_id   || null,
        driver_id:    form.driver_id    || null,
        start_date:   form.start_date   || null,
        end_date:     form.end_date     || null,
        price:        form.price        ? Number(form.price) : null,
        observations: form.observations || null,
        status:       form.status,
      })
      onSave()
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (!trip) return null

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: '16px', p: 1, minWidth: 540 } }}>
      <DialogTitle sx={{ fontWeight: 700, ...f }}>
        Gerenciar viagem #{trip.id}
        {trip.request && (
          <Typography sx={{ fontSize: '0.78rem', color: '#64748b', mt: 0.5, fontWeight: 400, ...f }}>
            {trip.request.origin} → {trip.request.destination} · {trip.request.passengers} passageiro(s)
          </Typography>
        )}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          {/* Veículo */}
          <FormControl size="small" fullWidth>
            <InputLabel sx={f}>Veículo</InputLabel>
            <Select label="Veículo" value={form.vehicle_id || ''} onChange={e => setForm(p => ({ ...p, vehicle_id: e.target.value }))} sx={selectSx}>
              <MenuItem value=""><em>Não definido</em></MenuItem>
              {vehicles.filter(v => v.active).map(v => (
                <MenuItem key={v.id} value={v.id} sx={f}>{v.brand} {v.model} — {v.plate}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Motorista */}
          <FormControl size="small" fullWidth>
            <InputLabel sx={f}>Motorista</InputLabel>
            <Select label="Motorista" value={form.driver_id || ''} onChange={e => setForm(p => ({ ...p, driver_id: e.target.value }))} sx={selectSx}>
              <MenuItem value=""><em>Não definido</em></MenuItem>
              {drivers.filter(d => d.active).map(d => (
                <MenuItem key={d.id} value={d.id} sx={f}>{d.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <DateField label="Data de início" value={form.start_date} onChange={set('start_date')} />
          <DateField label="Data de término" value={form.end_date}   onChange={set('end_date')} />

          {/* Valor */}
          <TextField
            label="Valor cobrado (R$)"
            size="small"
            type="number"
            value={form.price || ''}
            onChange={set('price')}
            inputProps={{ min: 0, step: '0.01' }}
            sx={inputSx}
          />

          {/* Status */}
          <FormControl size="small">
            <InputLabel sx={f}>Status</InputLabel>
            <Select label="Status" value={form.status || 'scheduled'} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} sx={selectSx}>
              {Object.entries(STATUS_MAP).map(([k, v]) => (
                <MenuItem key={k} value={k} sx={f}>{v.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Observações */}
          <TextField
            label="Observações"
            size="small"
            multiline
            rows={2}
            fullWidth
            value={form.observations || ''}
            onChange={set('observations')}
            sx={{ ...inputSx, gridColumn: '1 / -1' }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} sx={{ color: '#64748b', fontWeight: 600, ...f }}>Cancelar</Button>
        <Button onClick={handleSave} disabled={saving} variant="contained"
          sx={{ background: '#1a56db', fontWeight: 600, borderRadius: '10px', '&:hover': { background: '#1e3a8a' }, ...f }}>
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Salvar alterações'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function ReportDialog({ open, onClose, trips }) {
  const counts = {
    scheduled:   trips.filter(t => t.status === 'scheduled').length,
    in_progress: trips.filter(t => t.status === 'in_progress').length,
    completed:   trips.filter(t => t.status === 'completed').length,
    cancelled:   trips.filter(t => t.status === 'cancelled').length,
  }
  const totalRevenue = trips.reduce((acc, t) => acc + (t.price != null ? Number(t.price) : 0), 0)

  const handleDownload = () => {
    const headers = ['#', 'Cliente', 'Origem', 'Destino', 'Veículo', 'Placa', 'Motorista', 'Data Início', 'Data Fim', 'Status', 'Valor (R$)']
    const rows = trips.map(t => [
      t.id,
      t.client?.name || '',
      t.request?.origin || '',
      t.request?.destination || '',
      t.vehicle ? `${t.vehicle.brand} ${t.vehicle.model}` : '',
      t.vehicle?.plate || '',
      t.driver?.name || '',
      toDateInput(t.start_date),
      toDateInput(t.end_date),
      STATUS_MAP[t.status]?.label || t.status,
      t.price != null ? Number(t.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '',
    ])
    downloadCSV([headers, ...rows], 'viagens.csv')
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
      <DialogTitle sx={{ fontWeight: 700, ...f }}>
        <Box>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', ...f }}>Relatório de Viagens</Typography>
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
          <Box sx={{ background: STATUS_MAP.scheduled.bg, borderRadius: '12px', p: 2, border: '1px solid #f1f5f9' }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: STATUS_MAP.scheduled.color, textTransform: 'uppercase', letterSpacing: '0.05em', ...f }}>Agendadas</Typography>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: STATUS_MAP.scheduled.color, ...f }}>{counts.scheduled}</Typography>
          </Box>
          <Box sx={{ background: STATUS_MAP.in_progress.bg, borderRadius: '12px', p: 2, border: '1px solid #f1f5f9' }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: STATUS_MAP.in_progress.color, textTransform: 'uppercase', letterSpacing: '0.05em', ...f }}>Em andamento</Typography>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: STATUS_MAP.in_progress.color, ...f }}>{counts.in_progress}</Typography>
          </Box>
          <Box sx={{ background: STATUS_MAP.completed.bg, borderRadius: '12px', p: 2, border: '1px solid #f1f5f9' }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: STATUS_MAP.completed.color, textTransform: 'uppercase', letterSpacing: '0.05em', ...f }}>Concluídas</Typography>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: STATUS_MAP.completed.color, ...f }}>{counts.completed}</Typography>
          </Box>
          <Box sx={{ background: STATUS_MAP.cancelled.bg, borderRadius: '12px', p: 2, border: '1px solid #f1f5f9' }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: STATUS_MAP.cancelled.color, textTransform: 'uppercase', letterSpacing: '0.05em', ...f }}>Canceladas</Typography>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: STATUS_MAP.cancelled.color, ...f }}>{counts.cancelled}</Typography>
          </Box>
          <Box sx={{ background: '#f0fdf4', borderRadius: '12px', p: 2, border: '1px solid #dcfce7', gridColumn: 'span 3' }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em', ...f }}>Receita Total</Typography>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#166534', ...f }}>
              {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MONTHS = MONTH_NAMES.map((name, i) => ({ value: String(i + 1).padStart(2, '0'), label: name }))

const monthSelectSx = { borderRadius: '10px', background: '#f8fafc', fontSize: '0.78rem', fontWeight: 600, height: 32, '& fieldset': { borderColor: '#e2e8f0' }, '&.Mui-focused fieldset': { borderColor: '#1a56db', borderWidth: '2px' } }

export default function CompanyTrips({ companyId }) {
  const [trips, setTrips]           = useState([])
  const [vehicles, setVehicles]     = useState([])
  const [drivers, setDrivers]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState(null)
  const [cancelId, setCancelId]     = useState(null)
  const [filter, setFilter]         = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
  const [snack, setSnack]           = useState({ open: false, msg: '', severity: 'success' })
  const [reportOpen, setReportOpen] = useState(false)

  const load = async () => {
    try {
      const [t, v, d] = await Promise.all([
        tripAPI.getByCompany(companyId),
        vehicleAPI.getByCompany(companyId),
        driverAPI.getByCompany(companyId),
      ])
      setTrips(t); setVehicles(v); setDrivers(d)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (companyId) load() }, [companyId])

  const handleCancel = async () => {
    try {
      await tripAPI.cancel(cancelId)
      setSnack({ open: true, msg: 'Viagem cancelada.', severity: 'success' })
      load()
    } catch {
      setSnack({ open: true, msg: 'Erro ao cancelar.', severity: 'error' })
    }
    setCancelId(null)
  }

  const filtered = trips
    .filter(t => filter === 'all' || t.status === filter)
    .filter(t => monthFilter === 'all' || String(t.start_date).substring(5, 7) === monthFilter)

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', ...f }}>Viagens</Typography>
        <Typography sx={{ fontSize: '0.8rem', color: '#64748b', mt: 0.25, ...f }}>
          As viagens são criadas automaticamente quando você aceita uma solicitação. Aqui você gerencia o status, motorista, veículo e valor.
        </Typography>
      </Box>

      {/* Filtros de status + mês */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        {['all', 'scheduled', 'in_progress', 'completed', 'cancelled'].map(s => (
          <Button key={s} size="small" onClick={() => setFilter(s)}
            sx={{ fontWeight: 600, fontSize: '0.78rem', borderRadius: '8px', px: 1.5,
              background: filter === s ? '#1a56db' : '#f1f5f9',
              color: filter === s ? '#fff' : '#64748b',
              '&:hover': { background: filter === s ? '#1e3a8a' : '#e2e8f0' }, ...f }}>
            {s === 'all' ? `Todas (${trips.length})` : `${STATUS_MAP[s]?.label} (${trips.filter(t => t.status === s).length})`}
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
          onClick={() => setReportOpen(true)}
          sx={{ fontWeight: 600, fontSize: '0.78rem', borderRadius: '8px', px: 1.5,
            background: '#f0fdf4', color: '#166534',
            '&:hover': { background: '#dcfce7' }, ...f }}>
          Relatório
        </Button>
      </Box>

      <Box sx={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: '#1a56db' }} /></Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '1.5rem', mb: 1 }}>🗺️</Typography>
            <Typography sx={{ fontSize: '0.875rem', color: '#94a3b8', mb: 0.5, ...f }}>
              {filter === 'all' && monthFilter === 'all'
                ? 'Nenhuma viagem encontrada.'
                : 'Nenhuma viagem para os filtros selecionados.'}
            </Typography>
            {filter === 'all' && monthFilter === 'all' && (
              <Typography sx={{ fontSize: '0.8rem', color: '#cbd5e1', ...f }}>
                Aceite solicitações na aba "Solicitações" para gerar viagens automaticamente.
              </Typography>
            )}
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': thStyle }}>
                <TableCell>#</TableCell>
                <TableCell>Rota</TableCell>
                <TableCell>Veículo</TableCell>
                <TableCell>Motorista</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Data</TableCell>
                <TableCell>Valor</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(t => (
                <TableRow key={t.id} sx={{ '& td': tdStyle, '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell><Typography sx={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace' }}>#{t.id}</Typography></TableCell>
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
                  <TableCell><StatusChip status={t.status} /></TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button size="small" onClick={() => setSelected(t)}
                        sx={{ border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', px: 1.5, '&:hover': { background: '#f8fafc' } }}>
                        Gerenciar
                      </Button>
                      {t.status !== 'cancelled' && t.status !== 'completed' && (
                        <Button size="small" onClick={() => setCancelId(t.id)}
                          sx={{ border: '1px solid #fca5a5', color: '#dc2626', fontSize: '0.75rem', px: 1.5, '&:hover': { background: '#fef2f2' } }}>
                          Cancelar
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>

      <EditTripDialog
        open={!!selected}
        onClose={() => setSelected(null)}
        onSave={() => { load(); setSnack({ open: true, msg: 'Viagem atualizada.', severity: 'success' }) }}
        trip={selected}
        vehicles={vehicles}
        drivers={drivers}
      />
      <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} trips={filtered} />

      <Dialog open={!!cancelId} onClose={() => setCancelId(null)} PaperProps={{ sx: { borderRadius: '16px', p: 1, minWidth: 340 } }}>
        <DialogTitle sx={{ fontWeight: 700, ...f }}>Cancelar viagem</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.875rem', color: '#64748b', ...f }}>Tem certeza que deseja cancelar esta viagem?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setCancelId(null)} sx={{ color: '#64748b', fontWeight: 600, ...f }}>Voltar</Button>
          <Button onClick={handleCancel} sx={{ background: '#fee2e2', color: '#dc2626', fontWeight: 600, borderRadius: '10px', '&:hover': { background: '#fecaca' }, ...f }}>Confirmar cancelamento</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} sx={{ borderRadius: '10px', fontWeight: 600, ...f }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  )
}
