/*Login — validação mínima, só checa se está preenchido:
Usuário/e-mail → obrigatório
Senha → obrigatória

Cadastro:
Usuário → obrigatório, mínimo 3 caracteres
E-mail → obrigatório, formato válido (algo@algo.com)
Senha → obrigatório, mínimo 8 caracteres + ao menos 1 letra maiúscula + ao menos 1 número. 
Tem barra de força (Fraca / Regular / Boa / Forte)
Tipo de conta → obrigatório selecionar Usuário ou Empresa
Nome da empresa → obrigatório apenas se selecionou Empresa
CNPJ → obrigatório apenas se selecionou Empresa, máscara 00.000.000/0000-00, 14 dígitos, 
valida os dois dígitos verificadores pelo algoritmo oficial
O algoritmo do CNPJ calcula os dois últimos dígitos a partir dos 12 primeiros. Igual ao CPF — não é qualquer número que vale.
*/


import { useState, useEffect } from 'react'
import busconnect from '../assets/logo.png'

import {
  Box, Stack, Button, Typography, InputAdornment, IconButton,
  CircularProgress, Divider, Collapse, Alert,
} from '@mui/material'

import { EyeIcon, UserIcon, LockIcon, MailIcon, CompanyNameIcon, CnpjIcon } from '../components/ui/Icons'
import StyledTextField from '../components/ui/StyledTextField'
import { authAPI } from '../services/api'

// ─── Valores iniciais ─────────────────────────────────────────────────────────

const loginVazio    = () => ({ user: '', password: '' })
const registroVazio = () => ({ user: '', email: '', password: '', accountType: '', companyName: '', cnpj: '' })

// ─── Validadores ──────────────────────────────────────────────────────────────

const emailValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

const cnpjValido = (cnpj) => {
  const digitos = cnpj.replace(/\D/g, '')
  if (digitos.length !== 14) return false
  if (/^(\d)\1+$/.test(digitos)) return false // rejeita CNPJs com todos os dígitos iguais

  const calcular = (d, n) => {
    let soma = 0
    let pos = n - 7
    for (let i = n; i >= 1; i--) {
      soma += d.charAt(n - i) * pos--
      if (pos < 2) pos = 9
    }
    const resto = soma % 11 < 2 ? 0 : 11 - (soma % 11)
    return resto === parseInt(d.charAt(n))
  }

  return calcular(digitos, 12) && calcular(digitos, 13)
}

const formatarCNPJ = (valor) => {
  const digitos = valor.replace(/\D/g, '').slice(0, 14)
  if (digitos.length <= 2) return digitos
  if (digitos.length <= 5) return `${digitos.slice(0,2)}.${digitos.slice(2)}`
  if (digitos.length <= 8) return `${digitos.slice(0,2)}.${digitos.slice(2,5)}.${digitos.slice(5)}`
  if (digitos.length <= 12) return `${digitos.slice(0,2)}.${digitos.slice(2,5)}.${digitos.slice(5,8)}/${digitos.slice(8)}`
  return `${digitos.slice(0,2)}.${digitos.slice(2,5)}.${digitos.slice(5,8)}/${digitos.slice(8,12)}-${digitos.slice(12)}`
}

const validarCampoRegistro = (campo, valor, campos) => {
  switch (campo) {
    case 'user':
      if (!valor) return 'Informe um nome de usuário.'
      if (valor.trim().length < 3) return 'Mínimo de 3 caracteres.'
      return ''
    case 'email':
      if (!valor) return 'Informe seu e-mail.'
      if (!emailValido(valor)) return 'E-mail inválido.'
      return ''
    case 'password':
      if (!valor) return 'Informe uma senha.'
      if (valor.length < 8) return 'Mínimo de 8 caracteres.'
      if (!/[A-Z]/.test(valor)) return 'Inclua ao menos uma letra maiúscula.'
      if (!/[0-9]/.test(valor)) return 'Inclua ao menos um número.'
      return ''
    case 'accountType':
      if (!valor) return 'Selecione o tipo de conta.'
      return ''
    case 'companyName':
      if (campos.accountType === 'empresa' && !valor.trim()) return 'Informe o nome da empresa.'
      return ''
    case 'cnpj':
      if (campos.accountType === 'empresa') {
        if (!valor) return 'Informe o CNPJ.'
        if (valor.replace(/\D/g, '').length < 14) return 'CNPJ incompleto.'
        if (!cnpjValido(valor)) return 'CNPJ inválido.'
      }
      return ''
    default:
      return ''
  }
}

const validarCampoLogin = (campo, valor) => {
  switch (campo) {
    case 'user':
      if (!valor) return 'Informe seu usuário ou e-mail.'
      return ''
    case 'password':
      if (!valor) return 'Informe sua senha.'
      return ''
    default:
      return ''
  }
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function LoginScreen({ onLoginSuccess }) {
  const [ehRegistro, setEhRegistro]               = useState(false)
  const [camposLogin, setCamposLogin]             = useState(loginVazio())
  const [camposRegistro, setCamposRegistro]       = useState(registroVazio())
  const [errosLogin, setErrosLogin]               = useState({})
  const [errosRegistro, setErrosRegistro]         = useState({})
  const [tocado, setTocado]                       = useState({})
  const [mostrarSenha, setMostrarSenha]           = useState(false)
  const [carregando, setCarregando]               = useState(false)
  const [status, setStatus]                       = useState('idle')
  const [mensagemErro, setMensagemErro]           = useState('')
  const [visivel, setVisivel]                     = useState(true)
  const [montado, setMontado]                     = useState(false)

  useEffect(() => { setTimeout(() => setMontado(true), 50) }, [])

  // ── Alternar entre login e cadastro ──────────────────────────────────────────
  const alternarModo = (paraRegistro) => {
    setVisivel(false)
    setTimeout(() => {
      setEhRegistro(paraRegistro)
      setCamposLogin(loginVazio())
      setCamposRegistro(registroVazio())
      setErrosLogin({})
      setErrosRegistro({})
      setTocado({})
      setMostrarSenha(false)
      setStatus('idle')
      setVisivel(true)
    }, 200)
  }

  // ── Atualiza campo e revalida se já foi tocado ────────────────────────────────
  const aoMudarLogin = (campo) => (val) => {
    setCamposLogin(prev => ({ ...prev, [campo]: val }))
    if (tocado[campo]) {
      setErrosLogin(prev => ({ ...prev, [campo]: validarCampoLogin(campo, val) }))
    }
  }

  const aoMudarRegistro = (campo) => (val) => {
    if (campo === 'cnpj') val = formatarCNPJ(val)
    const atualizado = { ...camposRegistro, [campo]: val }
    setCamposRegistro(atualizado)
    if (tocado[campo]) {
      setErrosRegistro(prev => ({ ...prev, [campo]: validarCampoRegistro(campo, val, atualizado) }))
    }
  }

  // Revalida CNPJ e nome da empresa quando o tipo de conta muda
  useEffect(() => {
    if (tocado['cnpj'] || tocado['companyName']) {
      setErrosRegistro(prev => ({
        ...prev,
        cnpj: validarCampoRegistro('cnpj', camposRegistro.cnpj, camposRegistro),
        companyName: validarCampoRegistro('companyName', camposRegistro.companyName, camposRegistro),
      }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camposRegistro.accountType])

  const aoSairDoCampo = (campo) => () => {
    setTocado(prev => ({ ...prev, [campo]: true }))
    if (ehRegistro) {
      setErrosRegistro(prev => ({
        ...prev,
        [campo]: validarCampoRegistro(campo, camposRegistro[campo], camposRegistro),
      }))
    } else {
      setErrosLogin(prev => ({
        ...prev,
        [campo]: validarCampoLogin(campo, camposLogin[campo]),
      }))
    }
  }

  // ── Valida todos os campos antes de enviar ────────────────────────────────────
  const validarTudo = () => {
    if (ehRegistro) {
      const campos = ['user', 'email', 'password', 'accountType', 'companyName', 'cnpj']
      const erros = {}
      const novosTocados = {}
      campos.forEach(c => {
        novosTocados[c] = true
        erros[c] = validarCampoRegistro(c, camposRegistro[c] ?? '', camposRegistro)
      })
      setTocado(prev => ({ ...prev, ...novosTocados }))
      setErrosRegistro(erros)
      return Object.values(erros).every(e => !e)
    } else {
      const campos = ['user', 'password']
      const erros = {}
      const novosTocados = {}
      campos.forEach(c => {
        novosTocados[c] = true
        erros[c] = validarCampoLogin(c, camposLogin[c] ?? '')
      })
      setTocado(prev => ({ ...prev, ...novosTocados }))
      setErrosLogin(erros)
      return Object.values(erros).every(e => !e)
    }
  }

  // ── Envio do formulário ───────────────────────────────────────────────────────
  const aoEnviar = async () => {
    if (!validarTudo()) return

    setStatus('loading')
    setCarregando(true)
    try {
      const resposta = ehRegistro
        ? await authAPI.register({
            name: camposRegistro.user,
            email: camposRegistro.email,
            password: camposRegistro.password,
            account_type: camposRegistro.accountType === 'usuario' ? 'CLIENTE' : 'EMPRESA_ADMIN',
            ...(camposRegistro.accountType === 'empresa' && {
              company_name: camposRegistro.companyName,
              cnpj: camposRegistro.cnpj.replace(/\D/g, ''), // envia apenas os dígitos
            }),
          })
        : await authAPI.login({
            email: camposLogin.user,
            password: camposLogin.password,
          })

      const { user, token } = resposta
      localStorage.setItem('auth_token', token)
      setStatus('success')
      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess(user)
      }, 800)
    } catch (erro) {
      console.error('Falha no login/cadastro:', erro)
      let msgErro = 'Erro desconhecido'

      if (erro instanceof TypeError && erro.message === 'Failed to fetch') {
        msgErro = 'Não consegui conectar ao servidor. Verifique se o backend está rodando em http://localhost:8000'
      } else if (erro.response?.data?.errors) {
        const erros = erro.response.data.errors
        const primeiroErro = Object.values(erros)[0]
        msgErro = Array.isArray(primeiroErro) ? primeiroErro[0] : primeiroErro
      } else if (erro.response?.data?.message) {
        msgErro = erro.response.data.message
      } else if (erro.message) {
        msgErro = erro.message
      }

      setMensagemErro(msgErro)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    } finally {
      setCarregando(false)
    }
  }

  // ── Derivados ─────────────────────────────────────────────────────────────────
  const temErro    = status === 'error'
  const temSucesso = status === 'success'
  const ehEmpresa  = camposRegistro.accountType === 'empresa'

  const adornamentoSenha = (
  <InputAdornment position="end">
    <IconButton size="small" onClick={() => setMostrarSenha(prev => !prev)} sx={{ color: '#99a6b9', '&:hover': { color: '#1a56db' } }}>
      <EyeIcon open={mostrarSenha} />
    </IconButton>
  </InputAdornment>
  )

  // ── Força da senha ────────────────────────────────────────────────────────────
  const calcularForcaSenha = (senha) => {
    if (!senha) return null
    let pontos = 0
    if (senha.length >= 8) pontos++
    if (/[A-Z]/.test(senha)) pontos++
    if (/[0-9]/.test(senha)) pontos++
    if (/[^A-Za-z0-9]/.test(senha)) pontos++
    if (pontos <= 1) return { label: 'Fraca',   cor: '#ef4444', largura: '25%' }
    if (pontos === 2) return { label: 'Regular', cor: '#f97316', largura: '50%' }
    if (pontos === 3) return { label: 'Boa',     cor: '#eab308', largura: '75%' }
    return              { label: 'Forte',   cor: '#22c55e', largura: '100%' }
  }

  const forcaSenha = ehRegistro ? calcularForcaSenha(camposRegistro.password) : null

  const gradienteBotao = temSucesso
    ? 'linear-gradient(90deg, #059669, #10b981)'
    : temErro
      ? 'linear-gradient(90deg, #dc2626, #ef4444)'
      : 'linear-gradient(90deg, #1a56db, #2563eb)'

  const sombraBotao = temSucesso
    ? '0 4px 20px rgba(16,185,129,0.35)'
    : temErro
      ? '0 4px 20px rgba(239,68,68,0.35)'
      : '0 4px 20px rgba(26,86,219,0.3)'

  const textoBotao = carregando
    ? <CircularProgress size={18} sx={{ color: '#fff' }} />
    : temSucesso ? (ehRegistro ? '✓ Conta criada!' : '✓ Acesso autorizado')
    : temErro    ? (mensagemErro || (ehRegistro ? 'Erro ao criar conta' : 'Erro ao fazer login'))
    : ehRegistro ? 'Criar conta' : 'Entrar'

  // ── Renderização ──────────────────────────────────────────────────────────────
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <Box sx={{
        minHeight: '100vh', width: '100%', display: 'flex',
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 40%, #e0e7ff 100%)',
        position: 'relative', overflow: 'hidden',
      }}>

        {/* ── Painel esquerdo ── */}
        <Box sx={{
          display: { xs: 'none', md: 'flex' },
          width: '45%', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          p: 6, position: 'sticky', top: 0, height: '100vh', alignSelf: 'flex-start',
          opacity: montado ? 1 : 0, transform: montado ? 'none' : 'translateX(-30px)',
          transition: 'all 0.7s ease',
        }}>
          <Box sx={{ position: 'relative', mb: 5 }}>
            <Box sx={{
              width: 180, height: 180, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1a56db, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 24px 60px rgba(26,86,219,0.3)',
            }}>
              <img
                src={busconnect}
                alt="Bus Connect"
                style={{ width: 185, height: 185, objectFit: 'cover', borderRadius: '50%', background: '#fff' }}
              />
            </Box>
          </Box>

          <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', textAlign: 'center', lineHeight: 1.2, mb: 2 }}>
            Bus Connect
          </Typography>
          <Typography sx={{ color: '#475569', textAlign: 'center', maxWidth: 280, lineHeight: 1.7, fontSize: '0.95rem' }}>
            Plataforma completa para fretamento de ônibus. Empresas e gestão em um só lugar.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 4, width: '100%', maxWidth: 280 }}>
            {[
              { icone: '🚌', texto: 'Fretes de ônibus disponíveis' },
              { icone: '🏢', texto: 'Gestão para empresas' },
              { icone: '📍', texto: 'Rotas em tempo real' },
            ].map(({ icone, texto }) => (
              <Box key={texto} sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)',
                borderRadius: '10px', px: 2, py: 1.25,
                border: '1px solid rgba(255,255,255,0.9)',
              }}>
                <Typography sx={{ fontSize: '1.1rem' }}>{icone}</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#334155' }}>{texto}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ── Direita — formulário ── */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 3, sm: 4 } }}>
          <Box sx={{
            width: '100%', maxWidth: 420, minHeight: 540,
            background: '#fff', borderRadius: '20px',
            boxShadow: '0 8px 48px rgba(15,23,42,0.1), 0 2px 8px rgba(15,23,42,0.06)',
            overflow: 'hidden',
            opacity: montado ? 1 : 0,
            transform: montado ? 'none' : 'translateY(20px)',
            transition: 'all 0.6s ease 0.1s',
          }}>

            {/* Cabeçalho do card */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, background: '#1a56db', px: 4, py: 3.5 }}>
              <Box>
                <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.2 }}>Bus Connect</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem' }}>
                  {ehRegistro ? 'Crie sua conta' : 'Acesse sua conta'}
                </Typography>
              </Box>
            </Box>

            {/* Corpo do formulário */}
            <Box sx={{
              px: 4, py: 4,
              opacity: visivel ? 1 : 0,
              transform: visivel ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.2s ease, transform 0.2s ease',
            }}>
              <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
                {ehRegistro ? 'Criar nova conta' : 'Bem-vindo de volta'}
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8', mb: 3.5 }}>
                {ehRegistro ? 'Preencha os dados para se cadastrar' : 'Digite suas credenciais para continuar'}
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                {/* Alerta de erro do servidor */}
                <Collapse in={temErro && !!mensagemErro}>
                  <Alert severity="error" sx={{
                    borderRadius: '10px', fontSize: '0.85rem',
                    background: '#fee2e2', color: '#991b1b',
                    border: '1px solid #fecaca',
                    '& .MuiAlert-icon': { color: '#dc2626' },
                  }}>
                    {mensagemErro}
                  </Alert>
                </Collapse>

                {/* ── Campos de login ── */}
                {!ehRegistro && (
                  <>
                    <StyledTextField
                      label="Usuário ou e-mail"
                      value={camposLogin.user}
                      onChange={aoMudarLogin('user')}
                      onBlur={aoSairDoCampo('user')}
                      error={!!errosLogin.user}
                      helperText={errosLogin.user}
                      startIcon={<UserIcon />}
                    />
                    <StyledTextField
                      label="Senha"
                      value={camposLogin.password}
                      onChange={aoMudarLogin('password')}
                      onBlur={aoSairDoCampo('password')}
                      type={mostrarSenha ? 'text' : 'password'}
                      error={!!errosLogin.password}
                      helperText={errosLogin.password}
                      startIcon={<LockIcon />}
                      endAdornment={adornamentoSenha}
                    />
                    <Box sx={{ textAlign: 'right', mt: -0.5 }}>
                      <Typography sx={{ fontSize: '0.8rem', color: '#1a56db', cursor: 'pointer', fontWeight: 500, '&:hover': { color: '#1e3a8a', textDecoration: 'underline' } }}>
                        Esqueceu a senha?
                      </Typography>
                    </Box>
                  </>
                )}

                {/* ── Campos de cadastro ── */}
                {ehRegistro && (
                  <>
                    <StyledTextField
                      label="Usuário"
                      value={camposRegistro.user}
                      onChange={aoMudarRegistro('user')}
                      onBlur={aoSairDoCampo('user')}
                      error={!!errosRegistro.user}
                      helperText={errosRegistro.user}
                      startIcon={<UserIcon />}
                    />
                    <StyledTextField
                      label="E-mail"
                      value={camposRegistro.email}
                      onChange={aoMudarRegistro('email')}
                      onBlur={aoSairDoCampo('email')}
                      type="email"
                      error={!!errosRegistro.email}
                      helperText={errosRegistro.email}
                      startIcon={<MailIcon />}
                    />

                    {/* Senha com barra de força */}
                    <Box>
                      <StyledTextField
                        label="Senha"
                        value={camposRegistro.password}
                        onChange={aoMudarRegistro('password')}
                        onBlur={aoSairDoCampo('password')}
                        type={mostrarSenha ? 'text' : 'password'}
                        error={!!errosRegistro.password}
                        helperText={errosRegistro.password || 'Mín. 8 caracteres, uma maiúscula e um número.'}
                        startIcon={<LockIcon />}
                        endAdornment={adornamentoSenha}
                      />
                      {/* Barra de força da senha */}
                      {forcaSenha && (
                        <Box sx={{ mt: 1 }}>
                          <Box sx={{ height: 4, borderRadius: 2, background: '#e2e8f0', overflow: 'hidden' }}>
                            <Box sx={{
                              height: '100%', borderRadius: 2,
                              width: forcaSenha.largura,
                              background: forcaSenha.cor,
                              transition: 'width 0.3s ease, background 0.3s ease',
                            }} />
                          </Box>
                          <Typography sx={{ fontSize: '0.72rem', color: forcaSenha.cor, mt: 0.4, fontWeight: 500 }}>
                            Força da senha: {forcaSenha.label}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Seletor de tipo de conta */}
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      {['usuario', 'empresa'].map((tipo) => (
                        <Button
                          key={tipo}
                          fullWidth
                          onClick={() => aoMudarRegistro('accountType')(tipo)}
                          sx={{
                            py: 1, borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600,
                            background: camposRegistro.accountType === tipo ? '#1a56db' : '#f1f5f9',
                            color: camposRegistro.accountType === tipo ? '#fff' : '#64748b',
                            border: '1px solid ' + (camposRegistro.accountType === tipo ? '#1a56db' : errosRegistro.accountType ? '#dc2626' : '#e2e8f0'),
                            '&:hover': { background: camposRegistro.accountType === tipo ? '#1e3a8a' : '#e2e8f0' },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {tipo === 'usuario' ? 'Usuário' : 'Empresa'}
                        </Button>
                      ))}
                    </Box>
                    {errosRegistro.accountType && (
                      <Typography sx={{ fontSize: '0.75rem', color: '#dc2626', mt: -1 }}>
                        {errosRegistro.accountType}
                      </Typography>
                    )}

                    {/* Campos exclusivos para empresa */}
                    <Collapse in={ehEmpresa} unmountOnExit>
                      <Stack spacing={1.5}>
                        <StyledTextField
                          label="Nome da empresa"
                          value={camposRegistro.companyName}
                          onChange={aoMudarRegistro('companyName')}
                          onBlur={aoSairDoCampo('companyName')}
                          error={!!errosRegistro.companyName}
                          helperText={errosRegistro.companyName}
                          startIcon={<CompanyNameIcon />}
                        />
                        <StyledTextField
                          label="CNPJ"
                          value={camposRegistro.cnpj}
                          onChange={aoMudarRegistro('cnpj')}
                          onBlur={aoSairDoCampo('cnpj')}
                          error={!!errosRegistro.cnpj}
                          helperText={errosRegistro.cnpj}
                          startIcon={<CnpjIcon />}
                          placeholder="00.000.000/0000-00"
                          inputProps={{ maxLength: 18 }}
                        />
                      </Stack>
                    </Collapse>

                    {/* Aviso de aprovação para empresas */}
                    <Collapse in={ehEmpresa} unmountOnExit>
                      <Alert severity="info" sx={{
                        borderRadius: '10px', fontSize: '0.8rem',
                        background: '#eff6ff', color: '#1e3a8a',
                        border: '1px solid #bfdbfe',
                        '& .MuiAlert-icon': { color: '#1a56db' },
                      }}>
                        Contas do tipo empresa precisam de aprovação de um administrador para serem ativadas.
                      </Alert>
                    </Collapse>
                  </>
                )}

                {/* Botão de envio */}
                <Button
                  variant="contained" fullWidth
                  disabled={carregando}
                  onClick={aoEnviar}
                  sx={{
                    py: 1.4, mt: 0.5,
                    background: gradienteBotao,
                    boxShadow: sombraBotao,
                    transition: 'all 0.4s ease',
                    '&:hover:not(:disabled)': {
                      background: 'linear-gradient(90deg, #1e3a8a, #1a56db)',
                      boxShadow: '0 6px 24px rgba(26,86,219,0.45)',
                      transform: 'translateY(-1px)',
                    },
                    '&:active': { transform: 'translateY(0)' },
                    '&:disabled': { opacity: 0.85 },
                  }}
                >
                  {textoBotao}
                </Button>
              </Box>

              <Divider sx={{ my: 3, borderColor: '#f1f5f9' }}>
                <Typography sx={{ fontSize: '0.75rem', color: '#cbd5e1', px: 1 }}>ou</Typography>
              </Divider>

              {/* Alternador login/cadastro */}
              <Box sx={{ background: '#f8fafc', borderRadius: '12px', p: 2.5, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <Typography sx={{ fontSize: '0.82rem', color: '#64748b', mb: 0.5 }}>
                  {ehRegistro ? 'Já possui uma conta?' : 'Não possui conta?'}
                </Typography>
                <Typography
                  onClick={() => alternarModo(!ehRegistro)}
                  sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1a56db', cursor: 'pointer', '&:hover': { color: '#1e3a8a', textDecoration: 'underline' } }}
                >
                  {ehRegistro ? 'Entrar' : 'Cadastre-se'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  )
}