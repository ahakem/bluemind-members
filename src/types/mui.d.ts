import '@mui/material/styles';
import { ReactNode } from 'react';

declare module '@mui/material/styles' {
  interface Palette {
    neutral?: Palette['primary'];
  }
  interface PaletteOptions {
    neutral?: PaletteOptions['primary'];
  }
}

declare module '@mui/material/Alert' {
  interface AlertPropsColorOverrides {
    neutral: true;
  }
  interface AlertProps {
    children?: ReactNode;
  }
}

declare module '@mui/material/TextField' {
  interface TextFieldProps {
    margin?: 'none' | 'dense' | 'normal';
  }
}
