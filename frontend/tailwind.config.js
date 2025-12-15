/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
            },
            colors: {
                // SaaS Brand Colors
                // Corporate Blue Brand Colors
                brand: {
                    50: '#eaeffd',  // Very light blue tint
                    100: '#cdddfe', // Light blue background
                    200: '#a2bfff', // Soft blue
                    300: '#6e98fa', // Medium blue
                    400: '#3b70f6', // Action blue
                    500: '#0f62fe', // Primary Brand Blue (Corporate/IBM-ish)
                    600: '#0043ce', // Hover state
                    700: '#002d9c', // Active state / Header bg
                    800: '#001d6f', // Deep bg
                    900: '#001141', // Darkest bg (Sidebar)
                    950: '#000828', // Almost black blue
                },
                // Slate Grays for UI Structure
                slate: {
                    25: '#f8fafc', // Very light bg
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0', // Borders
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b', // Secondary text
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b', // Primary text
                    900: '#0f172a', // Sidebar bg
                }
            },
            boxShadow: {
                'saas-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                'saas-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                'saas-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                'glow': '0 0 15px rgba(99, 102, 241, 0.5)',
            }
        },
    },
    plugins: [],
}
