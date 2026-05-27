import { Box, Typography, Avatar, Button } from '@mui/material'
import busconnect from '../../assets/logo.png'

// ─── TopNavbar ────────────────────────────────────────────────────────────────
// Props:
//   links: [{ label, key }]   — navigation items
//   activeTab: string         — current active key
//   onTab: (key) => void      — tab change handler
//   userName: string          — shown in avatar tooltip
//   onLogout: () => void

export default function TopNavbar({ links = [], activeTab, onTab, userName = '', onLogout }) {
  const initials = userName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  return (
    <Box sx={{
      position: 'sticky', top: 0, zIndex: 100,
      background: '#fff',
      borderBottom: '1px solid #e2e8f0',
      boxShadow: '0 1px 8px rgba(15,23,42,0.06)',
      display: 'flex', alignItems: 'center',
      px: 4, height: 64, gap: 3,
    }}>
      {/* Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 2 }}>
        <img src={busconnect} alt="Bus Connect" style={{ width: 40, height: 40, objectFit: 'contain', background: '#fff' }} />
        <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', letterSpacing: '-0.01em', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
          Bus Connect
        </Typography>
      </Box>

      {/* Divider */}
      <Box sx={{ width: '1px', height: 24, background: '#e2e8f0', flexShrink: 0 }} />

      {/* Nav links */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
        {links.map(({ label, key }) => {
          const active = activeTab === key
          return (
            <Box
              key={key}
              onClick={() => onTab(key)}
              sx={{
                px: 2.5, py: 1, borderRadius: '8px', cursor: 'pointer',
                color: active ? '#1a56db' : '#64748b',
                background: active ? '#eff6ff' : 'transparent',
                fontWeight: active ? 600 : 500,
                fontSize: '0.875rem',
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                transition: 'all 0.15s',
                '&:hover': {
                  background: active ? '#eff6ff' : '#f8fafc',
                  color: active ? '#1a56db' : '#0f172a',
                },
              }}
            >
              {label}
            </Box>
          )
        })}
      </Box>

      {/* Right: avatar + logout */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{
            width: 34, height: 34,
            background: 'linear-gradient(135deg, #1a56db, #3b82f6)',
            fontSize: '0.75rem', fontWeight: 700,
            fontFamily: '"Plus Jakarta Sans", sans-serif',
          }}>
            {initials || '?'}
          </Avatar>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            {userName}
          </Typography>
        </Box>

        <Button
          size="small"
          onClick={onLogout}
          sx={{
            color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500,
            px: 1.5, py: 0.75, borderRadius: '8px',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            '&:hover': { background: '#fee2e2', color: '#dc2626' },
            transition: 'all 0.15s',
          }}
        >
          Sair
        </Button>
      </Box>
    </Box>
  )
}