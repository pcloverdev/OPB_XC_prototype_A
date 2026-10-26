/** Central color palette so screens/components stay visually consistent. */
export const colors = {
  bg: '#0B0B0F',
  surface: '#16161D',
  surfaceAlt: '#20202B',
  text: '#FFFFFF',
  textDim: '#9A9AA8',
  border: 'rgba(255,255,255,0.08)',

  // Category accents
  orange: '#FF7A3D',
  blue: '#3D9BFF',
  purple: '#9B6BFF',
  green: '#39D98A',

  success: '#39D98A',
  overlay: 'rgba(0,0,0,0.72)',
} as const;

export type AppColor = keyof typeof colors;
