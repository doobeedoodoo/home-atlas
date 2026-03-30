import type { ClerkProviderProps } from '@clerk/react';
import { theme } from '../../theme';

type ClerkAppearance = NonNullable<ClerkProviderProps['appearance']>;

export const clerkAppearance: ClerkAppearance = {
  layout: { logoPlacement: 'none' },
  variables: {
    colorPrimary: theme.palette.primary.main,
    colorBackground: theme.palette.background.paper,
    colorText: theme.palette.text.primary,
    colorTextSecondary: theme.palette.text.secondary,
    colorInputBackground: theme.palette.background.paper,
    colorInputText: theme.palette.text.primary,
    colorDanger: theme.palette.error.main,
    fontFamily: theme.typography.fontFamily,
    borderRadius: `${theme.shape.borderRadius}px`,
  },
};
