import { TextStyle } from 'react-native';

const createStyle = (
  fontSize: number,
  lineHeight: number,
  fontWeight: TextStyle['fontWeight'],
  letterSpacing?: number,
): TextStyle => ({
  fontSize,
  lineHeight,
  fontWeight,
  ...(letterSpacing !== undefined && { letterSpacing }),
});

export const fonts = {
  heading: 'SpaceGrotesk',
  body: 'DMSans',
};

export const typography = {
  h1: createStyle(36, 44, '800', -1),
  h2: createStyle(24, 32, '800'),
  h3: createStyle(20, 28, '700'),
  h4: createStyle(18, 24, '700'),
  body: createStyle(15, 22, '400'),
  bodyBold: createStyle(15, 22, '600'),
  caption: createStyle(13, 18, '500'),
  captionBold: createStyle(13, 18, '600'),
  label: createStyle(11, 16, '600'),
  price: createStyle(36, 44, '800', -1),
  priceSmall: createStyle(22, 28, '800'),
} as const;

export type TypographyToken = typeof typography;
