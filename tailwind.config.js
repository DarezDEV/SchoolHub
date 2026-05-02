/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#ffffff',
      black: '#000000',
      gray: {
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
      },
      blue: {
        400: '#38BDF8',
        500: '#3b82f6',
        600: '#2563EB',
        700: '#1E40AF',
      },
      green: {
        500: '#22C55E',
      },
      red: {
        500: '#EF4444',
      },
      amber: {
        500: '#F59E0B',
      },
      primary: "#2563EB",
      'primary-dark': "#1E40AF",
      secondary: "#38BDF8",
      success: "#22C55E",
      error: "#EF4444",
      warning: "#F59E0B",
      background: "#FFFFFF",
      surface: "#F1F5F9",
      'text-primary': "#1E293B",
      'text-secondary': "#64748B",
    },
  },
  plugins: [],
}
