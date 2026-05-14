import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-syne)', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#0D7C66',
          light: '#F0FDF4',
          dark: '#0F6E56',
        },
        danger: '#D85A30',
        warning: '#EF9F27',
        bg: {
          primary: '#FFFFFF',
          secondary: '#F5F7F9',
          tertiary: '#EEF0F3',
        },
        text: {
          primary: '#1A1A2E',
          secondary: '#6B7280',
          tertiary: '#9CA3AF',
        },
        border: {
          primary: '#E5E7EB',
          tertiary: '#E5E7EB',
        },
      },
      borderRadius: {
        lg: '10px',
        md: '6px',
      },
    },
  },
  plugins: [],
}

export default config
