import { TextField, InputAdornment } from '@mui/material'

export default function StyledTextField({ 
  label, value, onChange, onBlur, type = 'text', 
  error, helperText, startIcon, endAdornment, sx, 
  inputProps,
  ...rest 
}) {
  return (
    <TextField
      label={label}
      variant="outlined"
      fullWidth
      size="small"
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      error={error}
      helperText={helperText}
      sx={sx}
      slotProps={{
        input: {
          startAdornment: startIcon && (
            <InputAdornment position="start">{startIcon}</InputAdornment>
          ),
          endAdornment,
        },
        htmlInput: inputProps,
      }}
      {...rest}
    />
  )
}