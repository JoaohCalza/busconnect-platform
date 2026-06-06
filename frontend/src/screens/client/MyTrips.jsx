import { useState, useEffect } from 'react'
import {
  Box, Typography, Chip, CircularProgress, Button,
  Table, TableBody, TableCell, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl,
} from '@mui/material'
import { tripAPI } from '../../services/api'

const f = { fontFamily: '"Plus Jakarta Sans", sans-serif' }
const thStyle = { color: '#94a3b8', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', py: 1.5, ...f }
const tdStyle = { borderBottom: '1px solid #f8fafc', py: 1.5 }

const STATUS_MAP = {
  scheduled:   { label: 'Agendada',     bg: '#eff6ff', color: '#1a56db' },
  in_progress: { label: 'Em andamento', bg: '#fef3c7', color: '#92400e' },
  completed:   { label: 'Concluída',    bg: '#f0fdf4', color: '#166534' },
  cancelled:   { label: 'Cancelada',    bg: '#fee2e2', color: '#991b1b' },
}

const formatDate = (val) => {
  if (!val) return '—'
  const d = new Date(String(val).substring(0, 10) + 'T00:00:00')
  return d.toLocaleDateString('pt-BR')
}

const downloadCSV = (rows, filename) => {
  const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function StatusChip({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.scheduled
  return <Chip label={s.label} size="small" sx={{ background: s.bg, color: s.color, fontWeight: 600, fontSize: '0.72rem' }} />
}

function DetailDialog({ open, onClose, trip }) {
  if (!trip) return null
  const Row = ({ label, value }) => (
    <Box>
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', ...f }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.875rem', color: '#0f172a', fontWeight: 500, ...f }}>{value || '—'}</Typography>
    </Box>
  )
  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: '16px', p: 1, minWidth: 500 } }}>
      <DialogTitle sx={{ fontWeight: 700, ...f }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Viagem #{trip.id}
          <StatusChip status={trip.status} />
        </Box>
      </DialogTitle>
      <DialogContent sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, pt: '8px !important' }}>
        <Row label="Empresa" value={trip.company?.name} />
        <Row label="Motorista" value={trip.driver?.name} />
        <Row label="Veículo" value={trip.vehicle ? `${trip.vehicle.brand} ${trip.vehicle.model} (${trip.vehicle.plate})` : '—'} />
        <Row label="Categoria CNH" value={trip.driver?.cnh_category ? `Cat. ${trip.driver.cnh_category}` : '—'} />
        {trip.request && <>
          <Row label="Origem" value={trip.request.origin} />
          <Row label="Destino" value={trip.request.destination} />
          <Row label="Passageiros" value={trip.request.passengers} />
          {trip.request.notes && <Box sx={{ gridColumn: '1 / -1' }}><Row label="Observações" value={trip.request.notes} /></Box>}
        </>}
        <Row label="Data de início" value={formatDate(trip.start_date)} />
        <Row label="Data de término" value={formatDate(trip.end_date)} />
        {trip.price && <Row label="Valor" value={Number(trip.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />}
        {trip.observations && <Box sx={{ gridColumn: '1 / -1' }}><Row label="Observações da empresa" value={trip.observations} /></Box>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ color: '#64748b', fontWeight: 600, ...f }}>Fechar</Button>
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

  const handleDownload = () => {
    const headers = ['#', 'Empresa', 'Veículo', 'Placa', 'Motorista', 'Origem', 'Destino', 'Data Início', 'Status', 'Valor (R$)']
    const rows = trips.map(t => [
      t.id,
      t.company?.name || '',
      t.vehicle ? `${t.vehicle.brand} ${t.vehicle.model}` : '',
      t.vehicle?.plate || '',
      t.driver?.name || '',
      t.request?.origin || '',
      t.request?.destination || '',
      formatDate(t.start_date),
      STATUS_MAP[t.status]?.label || t.status,
      t.price != null ? Number(t.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '',
    ])
    downloadCSV([headers, ...rows], 'minhas-viagens.csv')
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
      <DialogTitle sx={{ fontWeight: 700, ...f }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', ...f }}>Relatório de Viagens</Typography>
            <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 400, mt: 0.25, ...f }}>
              Gerado em {new Date().toLocaleString('pt-BR')}
            </Typography>
          </Box>
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

const selectSx = { borderRadius: '10px', background: '#f8fafc', fontSize: '0.78rem', fontWeight: 600, height: 32, '& fieldset': { borderColor: '#e2e8f0' }, '&.Mui-focused fieldset': { borderColor: '#1a56db', borderWidth: '2px' } }

export default function MyTrips({ user }) {
  const [trips, setTrips]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState(null)
  const [filter, setFilter]         = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
  const [reportOpen, setReportOpen] = useState(false)

  useEffect(() => {
    tripAPI.getByClient(user.id)
      .then(data => setTrips(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user.id])

  const filtered = trips
    .filter(t => filter === 'all' || t.status === filter)
    .filter(t => monthFilter === 'all' || String(t.start_date).substring(5, 7) === monthFilter)

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', ...f }}>Minhas Viagens</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          {['all', 'scheduled', 'in_progress', 'completed', 'cancelled'].map(s => (
            <Button key={s} size="small" onClick={() => setFilter(s)}
              sx={{ fontWeight: 600, fontSize: '0.78rem', borderRadius: '8px', px: 1.5,
                background: filter === s ? '#1a56db' : '#f1f5f9',
                color: filter === s ? '#fff' : '#64748b',
                '&:hover': { background: filter === s ? '#1e3a8a' : '#e2e8f0' }, ...f }}>
              {s === 'all' ? 'Todas' : STATUS_MAP[s]?.label}
            </Button>
          ))}
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select
              value={monthFilter}
              onChange={e => setMonthFilter(e.target.value)}
              displayEmpty
              sx={{ ...selectSx, ...f }}
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
      </Box>

      <Box sx={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: '#1a56db' }} /></Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '1.5rem', mb: 1 }}>🚌</Typography>
            <Typography sx={{ fontSize: '0.875rem', color: '#94a3b8', ...f }}>
              {filter === 'all' && monthFilter === 'all'
                ? 'Nenhuma viagem encontrada.'
                : 'Nenhuma viagem para os filtros selecionados.'}
            </Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': thStyle }}>
                <TableCell>#</TableCell>
                <TableCell>Empresa</TableCell>
                <TableCell>Veículo</TableCell>
                <TableCell>Motorista</TableCell>
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
                  <TableCell><Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', ...f }}>{t.company?.name || '—'}</Typography></TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '0.8rem', color: '#0f172a', ...f }}>{t.vehicle ? `${t.vehicle.brand} ${t.vehicle.model}` : '—'}</Typography>
                    {t.vehicle?.plate && <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>{t.vehicle.plate}</Typography>}
                  </TableCell>
                  <TableCell><Typography sx={{ fontSize: '0.875rem', color: '#0f172a', ...f }}>{t.driver?.name || '—'}</Typography></TableCell>
                  <TableCell><Typography sx={{ fontSize: '0.8rem', color: '#64748b', ...f }}>{formatDate(t.start_date)}</Typography></TableCell>
                  <TableCell>
                    {t.price
                      ? <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#16a34a', ...f }}>{Number(t.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Typography>
                      : <Typography sx={{ fontSize: '0.8rem', color: '#cbd5e1', ...f }}>—</Typography>}
                  </TableCell>
                  <TableCell><StatusChip status={t.status} /></TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => setSelected(t)}
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

      <DetailDialog open={!!selected} onClose={() => setSelected(null)} trip={selected} />
      <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} trips={filtered} />
    </Box>
  )
}
