import React, { useMemo } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { Check, Close } from '@mui/icons-material';

interface PasswordStrengthProps {
  password: string;
}

interface StrengthResult {
  score: number; // 0-4
  label: string;
  color: string;
}

interface Requirement {
  label: string;
  met: boolean;
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const requirements: Requirement[] = useMemo(() => [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains a number', met: /[0-9]/.test(password) },
    { label: 'Contains special character (!@#$%^&*)', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ], [password]);

  const strength: StrengthResult = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '#e0e0e0' };
    
    const metCount = requirements.filter(r => r.met).length;
    
    if (metCount <= 1) return { score: 1, label: 'Weak', color: '#f44336' };
    if (metCount === 2) return { score: 2, label: 'Fair', color: '#ff9800' };
    if (metCount === 3) return { score: 3, label: 'Good', color: '#2196f3' };
    if (metCount >= 4) return { score: 4, label: 'Strong', color: '#4caf50' };
    
    return { score: 0, label: '', color: '#e0e0e0' };
  }, [password, requirements]);

  if (!password) return null;

  return (
    <Box sx={{ mt: 1 }}>
      {/* Strength bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Box sx={{ flex: 1 }}>
          <LinearProgress
            variant="determinate"
            value={(strength.score / 4) * 100}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                backgroundColor: strength.color,
                borderRadius: 3,
              },
            }}
          />
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: strength.color,
            fontWeight: 600,
            minWidth: 50,
            textAlign: 'right',
          }}
        >
          {strength.label}
        </Typography>
      </Box>

      {/* Requirements checklist */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 0.5,
        '& > *': {
          flexBasis: { xs: '100%', sm: '48%' },
        }
      }}>
        {requirements.map((req, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            {req.met ? (
              <Check sx={{ fontSize: 14, color: '#4caf50' }} />
            ) : (
              <Close sx={{ fontSize: 14, color: '#bdbdbd' }} />
            )}
            <Typography
              variant="caption"
              sx={{
                color: req.met ? '#4caf50' : '#9e9e9e',
                fontSize: '0.7rem',
              }}
            >
              {req.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default PasswordStrength;
