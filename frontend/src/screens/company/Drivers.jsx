import { useState, useEffect } from 'react'
import {
  Box, Typography, Button, Chip, CircularProgress, Snackbar, Alert,
  Table, TableBody, TableCell, TableHead, TableRow, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Switch, FormControlLabel,
} from '@mui/material'
import { driverAPI } from '../../services/api'

const f = { fontFamily: '"Plus Jakarta Sans", sans-serif' }
const thStyle = { color: '#94a3b8', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', py: 1.5, ...f }
const tdStyle = { borderBottom: '1px solid #f8fafc', py: 1.5 }

const empty = { name: '', cpf: '', cnh: '', cnh_category: 'D', phone: '', email: '', active: true }

function DriverDialog({ open, onClose, onSave, initial, companyId }) {
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => { setForm(initial ? { ...initial } : { ...empty }) }, [initial, open])

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...form, company_id: companyId }
      if (initial?.id) {
        await driverAPI.update(initial.id, payload)
      } else {
        await driverAPI.create(payload)
      }
      onSave()
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px', background: '#f8fafc', '& fieldset': { borderColor: '#e2e8f0' }, '&.Mui-focused fieldset': { borderColor: '#1a56db', borderWidth: '2px' } } }

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: '16px', p: 1, minWidth: 480 } }}>
      <DialogTitle sx={{ fontWeight: 700, ...f }}>{initial?.id ? 'Editar motorista' : 'Novo motorista'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <TextField label="Nome completo" size="small" value={form.name} onChange={set('name')} fullWidth sx={{ ...inputSx, gridColumn: '1 / -1' }} />
          <TextField label="CPF" size="small" value={form.cpf} onChange={set('cpf')} sx={inputSx} />
          <TextField label="CNH" size="small" value={form.cnh} onChange={set('cnh')} sx={inputSx} />
          <TextField label="Categoria CNH" size="small" value={form.cnh_category} onChange={set('cnh_category')} sx={inputSx} />
          <TextField label="Telefone" size="small" value={form.phone} onChange={set('phone')} sx={inputSx} />
          <TextField label="E-mail" size="small" type="email" value={form.email} onChange={set('email')} fullWidth sx={{ ...inputSx, gridColumn: '1 / -1' }} />
        </Box>
        <FormControlLabel
          control={<Switch checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#1a56db' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#1a56db' } }} />}
          label={<Typography sx={{ fontSize: '0.875rem', ...f }}>Ativo</Typography>}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} sx={{ color: '#64748b', fontWeight: 600, ...f }}>Cancelar</Button>
        <Button onClick={handleSave} disabled={saving || !form.name || !form.cpf || !form.cnh} variant="contained"
          sx={{ background: '#1a56db', fontWeight: 600, borderRadius: '10px', '&:hover': { background: '#1e3a8a' }, ...f }}>
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default function Drivers({ companyId }) {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog]   = useState({ open: false, item: null })
  const [deleteId, setDeleteId] = useState(null)
  const [snack, setSnack]     = useState({ open: false, msg: '', severity: 'success' })

  const load = async () => {
    try {
      const data = await driverAPI.getByCompany(companyId)
      setDrivers(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (companyId) load() }, [companyId])

  const handleDeactivate = async () => {
    try {
      await driverAPI.deactivate(deleteId)
      setDrivers(prev => prev.filter(d => d.id !== deleteId))
      setSnack({ open: true, msg: 'Motorista desativado.', severity: 'success' })
    } catch {
      setSnack({ open: true, msg: 'Erro ao desativar motorista.', severity: 'error' })
    }
    setDeleteId(null)
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', ...f }}>Motoristas</Typography>
        <Button onClick={() => setDialog({ open: true, item: null })}
          sx={{ background: '#1a56db', color: '#fff', fontWeight: 600, borderRadius: '10px', px: 2.5, '&:hover': { background: '#1e3a8a' }, ...f }}>
          + Novo motorista
        </Button>
      </Box>

      <Box sx={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: '#1a56db' }} /></Box>
        ) : drivers.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.875rem', color: '#94a3b8', ...f }}>Nenhum motorista cadastrado.</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': thStyle }}>
                <TableCell>Nome</TableCell>
                <TableCell>CPF</TableCell>
                <TableCell>CNH</TableCell>
                <TableCell>Categoria</TableCell>
                <TableCell>Contato</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {drivers.map(d => (
                <TableRow key={d.id} sx={{ '& td': tdStyle, '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 34, height: 34, background: '#e0e7ff', color: '#3730a3', fontSize: '0.8rem', fontWeight: 700 }}>{d.name.charAt(0)}</Avatar>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', ...f }}>{d.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell><Typography sx={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' }}>{d.cpf}</Typography></TableCell>
                  <TableCell><Typography sx={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' }}>{d.cnh}</Typography></TableCell>
                  <TableCell>
                    <Chip label={`Cat. ${d.cnh_category}`} size="small" sx={{ background: '#eff6ff', color: '#1a56db', fontWeight: 600, fontSize: '0.72rem' }} />
                  </TableCell>
                  <TableCell><Typography sx={{ fontSize: '0.8rem', color: '#64748b', ...f }}>{d.phone || d.email || '—'}</Typography></TableCell>
                  <TableCell>
                    {d.active
                      ? <Chip label="Ativo" size="small" sx={{ background: '#f0fdf4', color: '#166534', fontWeight: 600, fontSize: '0.75rem' }} />
                      : <Chip label="Inativo" size="small" sx={{ background: '#f8fafc', color: '#94a3b8', fontWeight: 600, fontSize: '0.75rem' }} />}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button size="small" onClick={() => setDialog({ open: true, item: d })}
                        sx={{ border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', px: 1.5, '&:hover': { background: '#f8fafc' } }}>
                        Editar
                      </Button>
                      <Button size="small" onClick={() => setDeleteId(d.id)}
                        sx={{ border: '1px solid #fca5a5', color: '#dc2626', fontSize: '0.75rem', px: 1.5, '&:hover': { background: '#fef2f2' } }}>
                        Desativar
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>

      <DriverDialog
        open={dialog.open}
        onClose={() => setDialog({ open: false, item: null })}
        onSave={() => { load(); setSnack({ open: true, msg: 'Motorista salvo.', severity: 'success' }) }}
        initial={dialog.item}
        companyId={companyId}
      />

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} PaperProps={{ sx: { borderRadius: '16px', p: 1, minWidth: 340 } }}>
        <DialogTitle sx={{ fontWeight: 700, ...f }}>Desativar motorista</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.875rem', color: '#64748b', ...f }}>Tem certeza que deseja desativar este motorista?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setDeleteId(null)} sx={{ color: '#64748b', fontWeight: 600, ...f }}>Cancelar</Button>
          <Button onClick={handleDeactivate} sx={{ background: '#fee2e2', color: '#dc2626', fontWeight: 600, borderRadius: '10px', '&:hover': { background: '#fecaca' }, ...f }}>Desativar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} sx={{ borderRadius: '10px', fontWeight: 600, ...f }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  )
}
