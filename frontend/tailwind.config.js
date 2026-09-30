/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        slowGradient: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        }
      },
      animation: {
        'slow-gradient': 'slowGradient 20s ease infinite',
      },
      colors: {
        border: "hsl(var(--ui-border) / <alpha-value>)",
        input: "hsl(var(--ui-input) / <alpha-value>)",
        ring: "hsl(var(--ui-ring) / <alpha-value>)",
        background: "hsl(var(--ui-background) / <alpha-value>)",
        foreground: "hsl(var(--ui-foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--ui-primary) / <alpha-value>)",
          foreground: "hsl(var(--ui-primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--ui-secondary) / <alpha-value>)",
          foreground: "hsl(var(--ui-secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--ui-destructive) / <alpha-value>)",
          foreground: "hsl(var(--ui-destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--ui-muted) / <alpha-value>)",
          foreground: "hsl(var(--ui-muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--ui-accent) / <alpha-value>)",
          foreground: "hsl(var(--ui-accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--ui-popover) / <alpha-value>)",
          foreground: "hsl(var(--ui-popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--ui-card) / <alpha-value>)",
          foreground: "hsl(var(--ui-card-foreground) / <alpha-value>)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}