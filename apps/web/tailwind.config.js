/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Base surfaces & text
        exibidos: {
          bg: "#0a0a0c",
          surface: "#141418",
          elevated: "#1c1c22",
          muted: "#6b6b7a",
          ink: "#f4f4f6",
          "ink-soft": "#b4b4be",
          shadow: "#1a0a1a",
          // Accents
          lime: "#b8ff3c",
          "lime-dim": "#8acc2e",
          purple: "#a855f7",
          "purple-dim": "#7c3aed",
          cyan: "#22d3ee",
          magenta: "#ec4899",
          amber: "#fbbf24",
        },
      },
      fontFamily: {
        sans: ["var(--font-exibidos-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "exibidos-sm": "10px",
        "exibidos-md": "16px",
        "exibidos-lg": "20px",
        "exibidos-xl": "24px",
        "exibidos-2xl": "28px",
      },
      boxShadow: {
        "exibidos-card":
          "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)",
        "exibidos-card-glow":
          "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(168,85,247,0.12)",
        "exibidos-glow-lime": "0 0 20px rgba(184,255,60,0.25)",
        "exibidos-glow-lime-hover": "0 0 32px rgba(184,255,60,0.35)",
        "exibidos-glow-purple": "0 0 24px rgba(168,85,247,0.2)",
        "exibidos-glow-cyan": "0 0 20px rgba(34,211,238,0.2)",
        "exibidos-glow-magenta": "0 0 20px rgba(236,72,153,0.2)",
        "exibidos-inner": "inset 0 1px 0 0 rgba(255,255,255,0.04)",
      },
      backgroundImage: {
        "exibidos-gradient-lime-cyan":
          "linear-gradient(135deg, #b8ff3c 0%, #22d3ee 100%)",
        "exibidos-gradient-purple-magenta":
          "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
        "exibidos-gradient-surface":
          "linear-gradient(180deg, rgba(28,28,34,0.6) 0%, rgba(20,20,24,0.95) 100%)",
      },
      animation: {
        "exibidos-bounce-soft": "exibidos-bounce-soft 0.4s ease-out",
        "exibidos-glow-pulse": "exibidos-glow-pulse 2s ease-in-out infinite",
      },
      keyframes: {
        "exibidos-bounce-soft": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.98)" },
        },
        "exibidos-glow-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      transitionDuration: {
        150: "150ms",
        200: "200ms",
        250: "250ms",
      },
    },
  },
  plugins: [],
};
