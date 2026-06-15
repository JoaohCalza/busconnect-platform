import { useState, useEffect, useRef } from 'react'
import { Box, Typography, Avatar, Button, Badge, IconButton, Paper, Divider } from '@mui/material'
import NotificationsIcon from '@mui/icons-material/Notifications'
import busconnect from '../../assets/logo.png'
import { notificationAPI } from '../../services/api'

export default function TopNavbar({ links = [], activeTab, onTab, userName = '', onLogout, userId }) {
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const unread = notifications.filter(n => !n.read).length

  const fetchNotifications = async () => {
    if (!userId) return
    try {
      const data = await notificationAPI.getByUser(userId)
      setNotifications(data)
    } catch (e) {
      console.error('Erro ao buscar notificações', e)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 15000) // polling 15s
    return () => clearInterval(interval)
  }, [userId])

  // fecha ao clicar fora
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = () => setOpen(o => !o)

  const handleMarkRead = async (id) => {
    await notificationAPI.markRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const initials = userName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <Box sx={{
      position: 'sticky', top: 0, zIndex: 100,
      background: '#fff',
      borderTop: '2px solid #1a56db',
      borderBottom: '2px solid #1a56db',
      boxShadow: '0 1px 8px rgba(15,23,42,0.06)',
      display: 'flex', alignItems: 'center',
      px: 4, height: 72, gap: 3,
    }}>
      {/* Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 2 }}>
        <img src={busconnect} alt="Bus Connect" style={{ width: 50, height: 50, objectFit: 'contain', background: '#ffffff' }} />
        <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: '#0f172a', letterSpacing: '-0.01em', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
          Bus Connect
        </Typography>
      </Box>

      <Box sx={{ width: '1px', height: 24, background: '#e2e8f0', flexShrink: 0 }} />

      {/* Nav links */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
        {links.map(({ label, key }) => {
          const active = activeTab === key
          return (
            <Box key={key} onClick={() => onTab(key)} sx={{
              px: 2.5, py: 1, borderRadius: '8px', cursor: 'pointer',
              color: active ? '#171418' : '#64748b',
              background: active ? '#c6cfda' : 'transparent',
              fontWeight: active ? 600 : 500,
              fontSize: '0.875rem',
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              transition: 'all 0.15s',
              '&:hover': { background: active ? '#495463' : '#c0c7ce', color: '#000000' },
            }}>
              {label}
            </Box>
          )
        })}
      </Box>

      {/* Right */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>

        {/* Sino */}
        <Box ref={ref} sx={{ position: 'relative' }}>
          <IconButton onClick={handleOpen} size="small">
            <Badge badgeContent={unread} color="error">
              <NotificationsIcon sx={{ color: '#64748b' }} />
            </Badge>
          </IconButton>

          {open && (
            <Paper elevation={4} sx={{
              position: 'absolute', right: 0, top: 44,
              width: 320, borderRadius: '12px', overflow: 'hidden',
              zIndex: 200,
            }}>
              <Box sx={{ px: 2, py: 1.5, background: '#f8fafc' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                  Notificações
                </Typography>
              </Box>
              <Divider />
              {notifications.length === 0 ? (
                <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                    Nenhuma notificação
                  </Typography>
                </Box>
              ) : (
                notifications.map(n => (
                  <Box
                    key={n.id}
                    onClick={() => handleMarkRead(n.id)}
                    sx={{
                      px: 2, py: 1.5, cursor: 'pointer',
                      background: n.read ? '#fff' : '#eff6ff',
                      borderLeft: n.read ? '3px solid transparent' : '3px solid #1a56db',
                      '&:hover': { background: '#f1f5f9' },
                      transition: 'all 0.15s',
                    }}
                  >
                    <Typography sx={{ fontSize: '0.82rem', color: '#0f172a', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                      {n.message}
                    </Typography>
                    <Typography sx={{ fontSize: '0.73rem', color: '#94a3b8', mt: 0.3, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                      {new Date(n.created_at).toLocaleString('pt-BR')}
                    </Typography>
                  </Box>
                ))
              )}
            </Paper>
          )}
        </Box>

        {/* Avatar + nome */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{
            width: 34, height: 34,
            background: 'linear-gradient(135deg, #3623e0, #3b82f6)',
            fontSize: '0.75rem', fontWeight: 700,
            fontFamily: '"Plus Jakarta Sans", sans-serif',
          }}>
            {initials || '?'}
          </Avatar>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            {userName}
          </Typography>
        </Box>

        <Button size="small" onClick={onLogout} sx={{
          color: '#090a0a', fontSize: '0.8rem', fontWeight: 500,
          px: 1.5, py: 0.75, borderRadius: '8px',
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          '&:hover': { background: '#fee2e2', color: '#dc2626' },
          transition: 'all 0.15s',
        }}>
          Sair
        </Button>
      </Box>
    </Box>
  )
}