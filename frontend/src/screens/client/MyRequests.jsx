import { useState, useEffect } from 'react'
import {
  Box, Typography, Chip, CircularProgress, Button, Snackbar, Alert,
  Table, TableBody, TableCell, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material'
import { tripRequestAPI } from '../../services/api'

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
  cancelled: { label: 'Cancelada', bg: '#f8fafc', color: '#94a3b8' },
}

function StatusChip({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.pending
  return <Chip label={s.label} size="small" sx={{ background: s.bg, color: s.color, fontWeight: 600, fontSize: '0.72rem' }} />
}

function DetailDialog({ open, onClose, request, onCancel }) {
  if (!request) return null
  const Row = ({ label, value }) => (
    <Box>
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', ...f }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.875rem', color: '#0f172a', fontWeight: 500, ...f }}>{value || '—'}</Typography>
    </Box>
  )
  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: '16px', p: 1, minWidth: 480 } }}>
      <DialogTitle sx={{ fontWeight: 700, ...f }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Solicitação #{request.id}
          <StatusChip status={request.status} />
        </Box>
      </DialogTitle>
      <DialogContent sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, pt: '8px !important' }}>
        <Row label="Empresa" value={request.company?.name} />
        <Row label="Veículo" value={request.vehicle ? `${request.vehicle.brand} ${request.vehicle.model}` : '—'} />
        <Row label="Origem" value={request.origin} />
        <Row label="Destino" value={request.destination} />
        <Row label="Data" value={formatDate(request.departure_date)} />
        <Row label="Horário" value={request.departure_time} />
        <Row label="Passageiros" value={request.passengers} />
        {request.notes && <Box sx={{ gridColumn: '1 / -1' }}><Row label="Observações" value={request.notes} /></Box>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} sx={{ color: '#64748b', fontWeight: 600, ...f }}>Fechar</Button>
        {request.status === 'pending' && (
          <Button onClick={() => onCancel(request.id)} sx={{ background: '#fee2e2', color: '#dc2626', fontWeight: 600, borderRadius: '10px', '&:hover': { background: '#fecaca' }, ...f }}>
            Cancelar solicitação
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default function MyRequests({ user }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter]     = useState('all')
  const [snack, setSnack]       = useState({ open: false, msg: '', severity: 'success' })

  const load = async () => {
    try {
      const data = await tripRequestAPI.getByClient(user.id)
      setRequests(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCancel = async (id) => {
    try {
      await tripRequestAPI.cancel(id)
      setSelected(null)
      load()
      setSnack({ open: true, msg: 'Solicitação cancelada.', severity: 'success' })
    } catch {
      setSnack({ open: true, msg: 'Erro ao cancelar.', severity: 'error' })
    }
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', ...f }}>Minhas Solicitações</Typography>
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
            <Typography sx={{ fontSize: '1.5rem', mb: 1 }}>📋</Typography>
            <Typography sx={{ fontSize: '0.875rem', color: '#94a3b8', ...f }}>Nenhuma solicitação encontrada.</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': thStyle }}>
                <TableCell>#</TableCell>
                <TableCell>Empresa</TableCell>
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
                  <TableCell><Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', ...f }}>{r.company?.name || '—'}</Typography></TableCell>
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

      <DetailDialog open={!!selected} onClose={() => setSelected(null)} request={selected} onCancel={handleCancel} />

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} sx={{ borderRadius: '10px', fontWeight: 600, ...f }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  )
}
