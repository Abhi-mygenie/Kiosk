/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      // Orientation-based breakpoints
      'portrait': { 'raw': '(orientation: portrait)' },
      'landscape': { 'raw': '(orientation: landscape)' },
      // Combined breakpoints for kiosk
      'portrait-sm': { 'raw': '(orientation: portrait) and (max-width: 768px)' },
      'portrait-md': { 'raw': '(orientation: portrait) and (min-width: 769px)' },
      'landscape-md': { 'raw': '(orientation: landscape) and (max-width: 1279px)' },
      'landscape-lg': { 'raw': '(orientation: landscape) and (min-width: 1280px)' },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'Montserrat', 'sans-serif'],
        heading: ['var(--font-heading)', 'Big Shoulders Display', 'sans-serif'],
        serif: ['var(--font-heading)', 'Big Shoulders Display', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Brand colors - now using CSS variables
        'blue-hero': 'var(--blue-hero, #62B5E5)',
        'blue-light': 'var(--blue-light, #78CAFF)',
        'blue-medium': 'var(--blue-medium, #177DAA)',
        'blue-dark': 'var(--blue-dark, #06293F)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('tailwind-scrollbar-hide')],
};