// Typography - Kiosk App
import { Platform } from 'react-native';

export const fonts = {
  // Heading font - Big Shoulders Display
  heading: 'BigShouldersDisplay-Bold',
  headingMedium: 'BigShouldersDisplay-SemiBold',
  
  // Body font - Montserrat
  body: 'Montserrat-Regular',
  bodyMedium: 'Montserrat-Medium',
  bodySemiBold: 'Montserrat-SemiBold',
  bodyBold: 'Montserrat-Bold',
};

export const fontSizes = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

export const lineHeights = {
  tight: 1.1,
  normal: 1.4,
  relaxed: 1.6,
};

// Text style presets for easy use
export const textStyles = {
  heading1: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['3xl'],
    lineHeight: fontSizes['3xl'] * lineHeights.tight,
  },
  heading2: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['2xl'],
    lineHeight: fontSizes['2xl'] * lineHeights.tight,
  },
  heading3: {
    fontFamily: fonts.headingMedium,
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * lineHeights.tight,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.normal,
  },
  bodySmall: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  button: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.tight,
  },
};

export default { fonts, fontSizes, lineHeights, textStyles };
