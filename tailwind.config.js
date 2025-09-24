/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      spacing: {
        '0.25': '0.0625rem', // 1px
        '0.75': '0.1875rem', // 3px
        '18': '4.5rem', // 72px
        '19': '4.75rem', // 76px
        '20': '5rem',   // 80px
        '22': '5.5rem', // 88px
        '24': '6rem',   // 96px
        '28': '7rem',   // 112px
        '30': '7.5rem', // 120px
        '32': '8rem',   // 128px
        '34': '8.5rem', // 136px
        '36': '9rem',   // 144px
        '40': '10rem',  // 160px
        '44': '11rem',  // 176px
        '48': '12rem',  // 192px
        '52': '13rem',  // 208px
        '56': '14rem',  // 224px
        '60': '15rem',  // 240px
        '64': '16rem',  // 256px
        '68': '17rem',  // 272px
        '72': '18rem',   // 288px
        '84': '21rem',   // 336px
        '96': '24rem',   // 384px
        '128': '32rem',  // 512px
        '144': '36rem',  // 576px
      },
      fontFamily: {
        sans: ['Montserrat', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      width: {
        '1/7': '14.285714%',
        '2/7': '28.571429%',
        '3/7': '42.857143%',
        '4/7': '57.142857%',
        '5/7': '71.428571%',
        '6/7': '85.714286%',
        '1/8': '12.5%',
        '3/8': '37.5%',
        '5/8': '62.5%',
        '7/8': '87.5%',
        '1/9': '11.111111%',
        '2/9': '22.222222%',
        '4/9': '44.444444%',
        '5/9': '55.555556%',
        '7/9': '77.777778%',
        '8/9': '88.888889%',
        '1/10': '10%',
        '3/10': '30%',
        '7/10': '70%',
        '9/10': '90%',
        '10': '2.5rem', // 40px
        '14': '3.5rem', // 56px
        '18': '4.5rem', // 72px
      },
      colors: {
        border: 'rgb(from var(--border) r g b / <alpha-value>)',
        input: 'rgb(from var(--input) r g b / <alpha-value>)',
        ring: 'rgb(from var(--ring) r g b / <alpha-value>)',
        background: 'rgb(from var(--background) r g b / <alpha-value>)',
        foreground: 'rgb(from var(--foreground) r g b / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(from var(--primary) r g b / <alpha-value>)',
          foreground: 'rgb(from var(--primary-foreground) r g b / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(from var(--secondary) r g b / <alpha-value>)',
          foreground: 'rgb(from var(--secondary-foreground) r g b / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'rgb(from var(--destructive) r g b / <alpha-value>)',
          foreground: 'rgb(from var(--destructive-foreground) r g b / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(from var(--muted) r g b / <alpha-value>)',
          foreground: 'rgb(from var(--muted-foreground) r g b / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(from var(--accent) r g b / <alpha-value>)',
          foreground: 'rgb(from var(--accent-foreground) r g b / <alpha-value>)',
        },
        highlight: {
          DEFAULT: 'rgb(from var(--highlight) r g b / <alpha-value>)',
          foreground: 'rgb(from var(--highlight-foreground) r g b / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'rgb(from var(--popover) r g b / <alpha-value>)',
          foreground: 'rgb(from var(--popover-foreground) r g b / <alpha-value>)',
        },
        card: {
          DEFAULT: 'rgb(from var(--card) r g b / <alpha-value>)',
          foreground: 'rgb(from var(--card-foreground) r g b / <alpha-value>)',
        },
        yellow: {
          50: '#fefce8',
          150: '#fef08a',
          250: '#facc15',
          350: '#d97706',
          450: '#a16207',
          550: '#713f12',
          650: '#4d7c0f',
          750: '#1a2e05',
          850: '#0f172a',
          950: '#14532d',
        },
        neutral: {
          50: '#fafafa',
          150: '#f0f0f0',
          250: '#d6d6d6',
          350: '#b8b8b8',
          450: '#8a8a8a',
          550: '#666666',
          650: '#484848',
          750: '#363636',
          850: '#1f1f1f',
          950: '#0a0a0a',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      borderWidth: {
        '1': '1px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
