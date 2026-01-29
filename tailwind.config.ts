import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0f1c',
        foreground: '#e2e8f0',
        primary: {
          DEFAULT: '#14b8a6',
          dark: '#0d9488',
          light: '#2dd4bf',
        },
        danger: '#ef4444',
        success: '#22c55e',
        warning: '#f59e0b',
        card: '#111827',
        'card-hover': '#1f2937',
        border: '#1e293b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
}
export default config
