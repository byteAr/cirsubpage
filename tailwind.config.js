/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'geist': ['Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('daisyui')
  ],
  daisyui: {
    themes: [
      {
        light: {
          "primary": "#00C768",
          "secondary": "#00A854", 
          "accent": "#60a5fa",
          "neutral": "#1f2937",
          "base-100": "#ffffff",
          "base-200": "#f8fafc",
          "base-300": "#e2e8f0",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
      },
    ],
    darkTheme: false, // Desactiva completamente el modo oscuro automático
    base: true, // Solo usar el tema base
    styled: true, // Usar estilos de DaisyUI
    utils: true, // Incluir clases utilitarias
    prefix: "", // Sin prefijo
    logs: true, // Mostrar logs en desarrollo
    themeRoot: ":root", // Aplicar tema en el root
  },
}
