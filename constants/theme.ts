export const LIGHT = {
    bg: '#F4F5FA',
    card: '#FFFFFF',
    primary: '#6C63FF',
    primaryLight: '#EEEEFF',
    primaryMid: '#A39DFF',
    danger: '#F43F5E',
    dangerLight: '#FFF1F3',
    warning: '#F59E0B',
    warningLight: '#FFFBEB',
    success: '#10B981',
    successLight: '#ECFDF5',
    text: '#111827',
    subtext: '#6B7280',
    border: '#E5E7EB',
    completed: '#9CA3AF',
};

export const DARK = {
    bg: '#0F0F17',
    card: '#1A1A27',
    primary: '#7C74FF',
    primaryLight: '#252340',
    primaryMid: '#6059CC',
    danger: '#FB7185',
    dangerLight: '#2D1520',
    warning: '#FBBF24',
    warningLight: '#292208',
    success: '#34D399',
    successLight: '#052E1A',
    text: '#F1F0FF',
    subtext: '#9091A4',
    border: '#282838',
    completed: '#4B4B65',
};

export type Theme = typeof LIGHT;

// Legacy export for tab layout compatibility
export const Colors = {
    light: { tint: LIGHT.primary },
    dark: { tint: DARK.primary },
};
