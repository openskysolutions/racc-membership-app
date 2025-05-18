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
      },
      colors: {
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        highlight: {
          DEFAULT: 'var(--highlight)',
          foreground: 'var(--highlight-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
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
    },
  },
  plugins: [require("tailwindcss-animate")],
};
