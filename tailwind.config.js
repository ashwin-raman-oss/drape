/** @type {import('tailwindcss').Config} */
/**
 * Border radius system:
 *   Cards and modals:       rounded-3xl  (1.5rem)
 *   Input fields:           rounded-2xl  (1rem)
 *   Full-width buttons:     rounded-2xl  (1rem)
 *   Small/inline buttons:   rounded-xl   (0.75rem)
 *   Pills and tags:         rounded-full
 *   Item thumbnails grids:  rounded-2xl  (1rem)
 */
export default {
  darkMode: false,
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#0A0A0A',
        surface:  '#141414',
        border:   '#1F1F1F',
        muted:    '#888888',
        accent:   '#C9A96E',
        primary:  '#F5F5F5',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
