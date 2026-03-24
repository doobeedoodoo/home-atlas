import type { ClerkProviderProps } from '@clerk/react';

type ClerkAppearance = NonNullable<ClerkProviderProps['appearance']>;

export const clerkAppearance: ClerkAppearance = {
  layout: { logoPlacement: 'none' },
  variables: {
    colorPrimary: '#00674F',
    colorBackground: '#ffffff',
    colorText: '#1A1A1A',
    colorTextSecondary: '#6B6B6B',
    colorInputBackground: '#ffffff',
    colorInputText: '#1A1A1A',
    colorDanger: '#d32f2f',
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    borderRadius: '8px',
  },
};
