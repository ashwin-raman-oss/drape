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
        bg:             'var(--bg)',
        surface:        'var(--surface)',
        'surface-2':    'var(--surface-2)',
        border:         'var(--border)',
        primary:        'var(--primary)',
        muted:          'var(--muted)',
        // accent uses RGB channels so opacity modifiers (bg-accent/15) work
        accent:         'rgb(var(--accent) / <alpha-value>)',
        'accent-hover': 'var(--accent-hover)',
        error:          'var(--error)',
        warning:        'var(--warning)',
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.card-shadow': {
          'box-shadow': 'var(--card-shadow)',
        },
      })
    },
  ],
}
