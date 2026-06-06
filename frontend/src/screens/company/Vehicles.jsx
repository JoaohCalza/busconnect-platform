import { useState, useEffect } from 'react'
import {
  Box, Typography, Button, Chip, CircularProgress, Snackbar, Alert,
  Table, TableBody, TableCell, TableHead, TableRow, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Tooltip,
} from '@mui/material'
import { vehicleAPI } from '../../services/api'

const f = { fontFamily: '"Plus Jakarta Sans", sans-serif' }
const thStyle = { color: '#94a3b8', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', py: 1.5, ...f }
const tdStyle = { borderBottom: '1px solid #f8fafc', py: 1.5 }
const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px', background: '#f8fafc', '& fieldset': { borderColor: '#e2e8f0' }, '&.Mui-focused fieldset': { borderColor: '#1a56db', borderWidth: '2px' } } }

const empty = { plate: '', brand: '', model: '', year: new Date().getFullYear(), capacity: 40, price_per_km: '', description: '', image: '' }

const fmtPrice = (val) => val != null && val !== ''
  ? Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  : '—'

function VehicleDialog({ open, onClose, onSave, initial, companyId }) {
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => { setForm(initial ? { ...initial } : { ...empty }) }, [initial, open])

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...form, company_id: companyId, year: Number(form.year), capacity: Number(form.capacity), price_per_km: form.price_per_km !== '' ? Number(form.price_per_km) : null }
      if (initial?.id) {
        await vehicleAPI.update(initial.id, payload)
      } else {
        // novo veículo começa fora do catálogo (active=false) — empresa publica manualmente
        await vehicleAPI.create({ ...payload, active: false })
      }
      onSave()
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: '16px', p: 1, minWidth: 480 } }}>
      <DialogTitle sx={{ fontWeight: 700, ...f }}>{initial?.id ? 'Editar veículo' : 'Cadastrar veículo'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        {!initial?.id && (
          <Box sx={{ background: '#eff6ff', borderRadius: '10px', px: 2, py: 1.5 }}>
            <Typography sx={{ fontSize: '0.8rem', color: '#1a56db', fontWeight: 500, ...f }}>
              Após cadastrar, use "Publicar no catálogo" para que clientes possam solicitar viagens neste veículo.
            </Typography>
          </Box>
        )}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <TextField label="Placa" size="small" value={form.plate} onChange={set('plate')} sx={inputSx} />
          <TextField label="Marca" size="small" value={form.brand} onChange={set('brand')} sx={inputSx} />
          <TextField label="Modelo" size="small" value={form.model} onChange={set('model')} sx={inputSx} />
          <TextField label="Ano" size="small" type="number" value={form.year} onChange={set('year')} sx={inputSx} />
          <TextField label="Capacidade (passageiros)" size="small" type="number" value={form.capacity} onChange={set('capacity')} sx={inputSx} />
          <TextField label="Valor por km (R$/km)" size="small" type="number" value={form.price_per_km ?? ''} onChange={set('price_per_km')} inputProps={{ min: 0, step: '0.01' }} sx={inputSx} />
          <TextField label="URL da imagem" size="small" value={form.image || ''} onChange={set('image')} sx={inputSx} />
        </Box>
        <TextField label="Descrição" size="small" multiline rows={3} fullWidth value={form.description || ''} onChange={set('description')} sx={inputSx} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} sx={{ color: '#64748b', fontWeight: 600, ...f }}>Cancelar</Button>
        <Button onClick={handleSave} disabled={saving || !form.plate || !form.brand || !form.model} variant="contained"
          sx={{ background: '#1a56db', fontWeight: 600, borderRadius: '10px', '&:hover': { background: '#1e3a8a' }, ...f }}>
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default function Vehicles({ companyId, companyStatus }) {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading]   = useState(true)
  const [dialog, setDialog]     = useState({ open: false, item: null })
  const [snack, setSnack]       = useState({ open: false, msg: '', severity: 'success' })
  const [toggling, setToggling] = useState(null)

  const load = async () => {
    try {
      const data = await vehicleAPI.getByCompany(companyId)
      setVehicles(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (companyId) load() }, [companyId])

  const handleToggleCatalog = async (vehicle) => {
    setToggling(vehicle.id)
    try {
      await vehicleAPI.update(vehicle.id, { active: !vehicle.active })
      const msg = vehicle.active
        ? 'Veículo retirado do catálogo.'
        : 'Veículo publicado no catálogo! Clientes já podem solicitar viagens.'
      setSnack({ open: true, msg, severity: 'success' })
      load()
    } catch {
      setSnack({ open: true, msg: 'Erro ao atualizar status.', severity: 'error' })
    } finally {
      setToggling(null)
    }
  }

  const published  = vehicles.filter(v => v.active)
  const unpublished = vehicles.filter(v => !v.active)

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', ...f }}>Veículos</Typography>
          <Typography sx={{ fontSize: '0.8rem', color: '#64748b', mt: 0.25, ...f }}>
            {published.length} publicado{published.length !== 1 ? 's' : ''} no catálogo · {unpublished.length} fora do catálogo
          </Typography>
        </Box>
        <Button onClick={() => setDialog({ open: true, item: null })}
          sx={{ background: '#1a56db', color: '#fff', fontWeight: 600, borderRadius: '10px', px: 2.5, '&:hover': { background: '#1e3a8a' }, ...f }}>
          + Cadastrar veículo
        </Button>
      </Box>

      {/* ── Aviso empresa não aprovada ── */}
      {Number(companyStatus) !== 3 && (
        <Box sx={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '12px', px: 3, py: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography sx={{ fontSize: '1.2rem' }}>⚠️</Typography>
          <Box>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#92400e', ...f }}>
              {Number(companyStatus) === 1 ? 'Empresa aguardando aprovação' : 'Empresa rejeitada'}
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: '#92400e', ...f }}>
              {Number(companyStatus) === 1
                ? 'Seus veículos não aparecem no catálogo até que o administrador aprove sua empresa. Você pode cadastrá-los agora mesmo.'
                : 'Sua empresa foi rejeitada. Entre em contato com o administrador.'}
            </Typography>
          </Box>
        </Box>
      )}

      {/* ── Info box ── */}
      <Box sx={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', px: 3, py: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Typography sx={{ fontSize: '1.1rem' }}>💡</Typography>
        <Typography sx={{ fontSize: '0.8rem', color: '#166534', ...f }}>
          Veículos <strong>publicados</strong> aparecem no catálogo para os clientes e podem receber solicitações de viagem.
          Veículos <strong>fora do catálogo</strong> são invisíveis para os clientes.
        </Typography>
      </Box>

      <Box sx={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: '#1a56db' }} /></Box>
        ) : vehicles.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '1.5rem', mb: 1 }}>🚌</Typography>
            <Typography sx={{ fontSize: '0.875rem', color: '#94a3b8', ...f }}>Nenhum veículo cadastrado ainda.</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': thStyle }}>
                <TableCell>Veículo</TableCell>
                <TableCell>Placa</TableCell>
                <TableCell>Ano</TableCell>
                <TableCell>Capacidade</TableCell>
                <TableCell>R$/km</TableCell>
                <TableCell>Catálogo</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vehicles.map(v => (
                <TableRow key={v.id} sx={{ '& td': tdStyle, '&:last-child td': { borderBottom: 0 }, opacity: v.active ? 1 : 0.6 }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar src={v.image || ''} variant="rounded" sx={{ width: 40, height: 40, background: '#e0e7ff', color: '#3730a3', fontSize: '0.75rem', fontWeight: 700 }}>
                        {!v.image && '🚌'}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', ...f }}>{v.brand} {v.model}</Typography>
                        {v.description && <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', ...f, maxWidth: 200, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{v.description}</Typography>}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><Typography sx={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{v.plate}</Typography></TableCell>
                  <TableCell><Typography sx={{ fontSize: '0.875rem', color: '#64748b', ...f }}>{v.year}</Typography></TableCell>
                  <TableCell><Typography sx={{ fontSize: '0.875rem', color: '#64748b', ...f }}>{v.capacity} pax</Typography></TableCell>
                  <TableCell><Typography sx={{ fontSize: '0.875rem', color: v.price_per_km ? '#0f172a' : '#94a3b8', fontWeight: v.price_per_km ? 600 : 400, ...f }}>{v.price_per_km != null ? `R$ ${Number(v.price_per_km).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/km` : '—'}</Typography></TableCell>
                  <TableCell>
                    {v.active ? (
                      <Chip label="✓ Publicado" size="small" sx={{ background: '#f0fdf4', color: '#16a34a', fontWeight: 700, fontSize: '0.72rem' }} />
                    ) : (
                      <Chip label="Fora do catálogo" size="small" sx={{ background: '#f8fafc', color: '#94a3b8', fontWeight: 600, fontSize: '0.72rem' }} />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button size="small" onClick={() => setDialog({ open: true, item: v })}
                        sx={{ border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', px: 1.5, '&:hover': { background: '#f8fafc' } }}>
                        Editar
                      </Button>
                      <Tooltip title={v.active ? 'Retirar do catálogo de clientes' : 'Publicar para que clientes possam solicitar'} arrow>
                        <Button
                          size="small"
                          disabled={toggling === v.id}
                          onClick={() => handleToggleCatalog(v)}
                          sx={v.active
                            ? { border: '1px solid #fca5a5', color: '#dc2626', fontSize: '0.75rem', px: 1.5, '&:hover': { background: '#fef2f2' } }
                            : { border: '1px solid #86efac', color: '#16a34a', fontSize: '0.75rem', px: 1.5, '&:hover': { background: '#f0fdf4' } }
                          }
                        >
                          {toggling === v.id
                            ? <CircularProgress size={14} />
                            : v.active ? 'Retirar do catálogo' : '📢 Publicar no catálogo'}
                        </Button>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>

      <VehicleDialog
        open={dialog.open}
        onClose={() => setDialog({ open: false, item: null })}
        onSave={() => { load(); setSnack({ open: true, msg: 'Veículo salvo com sucesso.', severity: 'success' }) }}
        initial={dialog.item}
        companyId={companyId}
      />

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} sx={{ borderRadius: '10px', fontWeight: 600, ...f }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  )
}
