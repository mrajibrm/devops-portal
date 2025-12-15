/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: [
                    '-apple-system',
                    'BlinkMacSystemFont',
                    '"Segoe UI"',
                    'Roboto',
                    '"Helvetica Neue"',
                    'Arial',
                    'sans-serif'
                ],
            },
            colors: {
                // Apple-like System Colors
                'apple-gray': '#f5f5f7', // Background
                'apple-blue': '#0071e3', // Primary Action
                'apple-dark': '#1d1d1f', // Text Primary
                'apple-light': '#86868b', // Text Secondary
                // Semantic
                primary: '#0071e3',
                secondary: '#86868b',
                success: '#34c759',
                warning: '#ff9f0a',
                danger: '#ff3b30',

                // Dark Mode adaptations
                'dark-bg': '#000000',
                'dark-card': '#1c1c1e',
            }
        },
    },
    plugins: [],
}
