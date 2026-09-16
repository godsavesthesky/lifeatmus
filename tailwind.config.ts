import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0C',
        navy: '#0E1526',
        cream: '#F4F1E8',
        lime: '#C6FF4A',
        limedim: '#9FE023',
        muted: '#8B93A6',
        line: 'rgba(244,241,232,0.12)',
        // Garis yang lebih tegas untuk pemisah struktural (indeks, tabel).
        rule: 'rgba(244,241,232,0.22)',
      },
      fontFamily: {
        display: ['"Big Shoulders Display"', 'Impact', 'sans-serif'],
        body: ['"Schibsted Grotesk"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Skala display yang sengaja melompat jauh — ukuran sedang sengaja
        // tidak disediakan supaya tidak tergoda bikin hierarki setengah-setengah.
        mega: ['clamp(4rem, 15vw, 13rem)', { lineHeight: '0.78', letterSpacing: '-0.035em' }],
        huge: ['clamp(2.75rem, 7vw, 5.5rem)', { lineHeight: '0.85', letterSpacing: '-0.03em' }],
        loud: ['clamp(1.75rem, 3.5vw, 2.75rem)', { lineHeight: '0.9', letterSpacing: '-0.02em' }],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      borderRadius: {
        none: '0',
        sm: '2px',
        DEFAULT: '3px',
        full: '9999px',
      },
      transitionTimingFunction: {
        // Satu kurva untuk seluruh aplikasi. Konsistensi gerak lebih terasa
        // "dirancang" daripada memakai easing berbeda di tiap komponen.
        studio: 'cubic-bezier(0.16, 1, 0.3, 1)',
        snap: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        // Baris judul naik dari balik topeng — dipakai sekali saja saat load.
        riseIn: {
          '0%': { transform: 'translate3d(0, 105%, 0) rotate(2deg)' },
          '100%': { transform: 'translate3d(0, 0, 0) rotate(0deg)' },
        },
        marquee: {
          '0%': { transform: 'translate3d(0, 0, 0)' },
          '100%': { transform: 'translate3d(-50%, 0, 0)' },
        },
        stamp: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(0.88) rotate(-3deg)' },
          '100%': { transform: 'scale(1) rotate(0)' },
        },
        drift: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-14px) rotate(4deg)' },
        },
      },
      animation: {
        riseIn: 'riseIn 0.9s cubic-bezier(0.16, 1, 0.3, 1) both',
        marquee: 'marquee 32s linear infinite',
        stamp: 'stamp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        drift: 'drift 9s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config