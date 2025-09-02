/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fffdd0',
          100: '#fffacd',
          200: '#fff8dc',
          300: '#f5f5dc',
          400: '#f0e68c',
          500: '#daa520',
        },
        beige: {
          50: '#f7f6f3',
          100: '#f0ede6',
          200: '#e8e2d4',
          300: '#ddd4c1',
          400: '#d1c4a9',
          500: '#c5b491',
        },
        brown: {
          50: '#faf8f5',
          100: '#f4f0ea',
          200: '#e8ddd1',
          300: '#d6c4b1',
          400: '#c4a888',
          500: '#b5946f',
        },
      },
    },
  },
  plugins: [],
}