/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#E94F9E',
                dark: '#000000',
                surface: '#0a0a0a',
            },
            fontFamily: {
                modak: ['Modak', 'cursive'],
                inter: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
