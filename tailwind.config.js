/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ESI Clinical Acuity Levels
        esi: {
          1: {
            bg: '#991B1B',      // Red 800 - Resuscitation
            text: '#FEF2F2',    // Red 50
            border: '#EF4444',  // Red 500
          },
          2: {
            bg: '#C2410C',      // Orange 700 - Emergent
            text: '#FFF7ED',    // Orange 50
            border: '#F97316',  // Orange 500
          },
          3: {
            bg: '#B45309',      // Amber 700 - Urgent
            text: '#FEF3C7',    // Amber 50
            border: '#F59E0B',  // Amber 500
          },
          4: {
            bg: '#1D4ED8',      // Blue 700 - Less Urgent
            text: '#EFF6FF',    // Blue 50
            border: '#3B82F6',  // Blue 500
          },
          5: {
            bg: '#047857',      // Emerald 700 - Non-Urgent
            text: '#ECFDF5',    // Emerald 50
            border: '#10B981',  // Emerald 500
          },
        },
        // Clinical Neutrals
        clinical: {
          bg: '#F8FAFC',        // Slate 50 (Calming low-saturation base)
          card: '#FFFFFF',      // White
          border: '#E2E8F0',    // Slate 200
          text: {
            primary: '#0F172A',   // Slate 900
            secondary: '#475569', // Slate 600
            muted: '#94A3B8',     // Slate 400
          }
        },
        // Confidence Colors
        confidence: {
          high: {
            bg: '#DCFCE7',      // Green 100
            text: '#15803D',    // Green 700
          },
          medium: {
            bg: '#FEF3C7',      // Amber 100
            text: '#B45309',    // Amber 700
          },
          low: {
            bg: '#FEE2E2',      // Red 100
            text: '#B91C1C',    // Red 700
          }
        },
        // Intervention States
        intervention: {
          override: {
            bg: '#F3E8FF',      // Violet 100
            text: '#6D28D9',    // Violet 700
            border: '#C084FC',  // Violet 400
          },
          alert: {
            bg: '#FEF2F2',      // Red 50
            border: '#EF4444',  // Red 500
            pulse: '#EF4444',   // Red 500
          }
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'Monaco',
          'Consolas',
          'monospace'
        ]
      },
      spacing: {
        '1.5': '0.375rem',
        '2.5': '0.625rem',
        '3.5': '0.875rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-rapid': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
