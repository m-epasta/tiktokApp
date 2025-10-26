module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        glass: {
          50: 'rgba(255,255,255,0.5)',
          70: 'rgba(255,255,255,0.7)'
        }
      },
      backdropBlur: {
        xs: '2px'
      },
      boxShadow: {
        glass: '0 8px 30px rgba(0,0,0,0.08)'
      }
    },
  },
  plugins: [],
}