/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'iris': {
          DEFAULT: '#454ade',
          100: '#090a31',
          200: '#111463',
          300: '#1a1e94',
          400: '#2328c6',
          500: '#454ade',
          600: '#6a6ee5',
          700: '#8f92eb',
          800: '#b4b6f2',
          900: '#dadbf8'
        },
        'space_cadet': {
          DEFAULT: '#1b1f3b',
          100: '#05060c',
          200: '#0b0c18',
          300: '#101324',
          400: '#161930',
          500: '#1b1f3b',
          600: '#363d75',
          700: '#515caf',
          800: '#8b92ca',
          900: '#c5c9e4'
        },
        'electric_purple': {
          DEFAULT: '#b14aed',
          100: '#260639',
          200: '#4c0b71',
          300: '#7211aa',
          400: '#9816e2',
          500: '#b14aed',
          600: '#c16ef1',
          700: '#d092f4',
          800: '#e0b7f8',
          900: '#efdbfb'
        },
        'french_mauve': {
          DEFAULT: '#c874d9',
          100: '#2e0e34',
          200: '#5b1d68',
          300: '#892b9c',
          400: '#b33fca',
          500: '#c874d9',
          600: '#d38fe0',
          700: '#deabe8',
          800: '#e9c7f0',
          900: '#f4e3f7'
        },
        'fairy_tale': {
          DEFAULT: '#e1bbc9',
          100: '#391925',
          200: '#73324a',
          300: '#ac4c6f',
          400: '#c8829c',
          500: '#e1bbc9',
          600: '#e7c9d4',
          700: '#edd7df',
          800: '#f3e4ea',
          900: '#f9f2f4'
        }
      }
    },
  },
  plugins: [],
}