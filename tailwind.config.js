/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./public/**/*.{html,js}"],
    theme: {
        extend: {
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'slide-in-left': 'slideInLeft 0.3s ease-out',
                'bounce-dot': 'bounceDot 1.4s infinite ease-in-out both'
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' }
                },
                slideInLeft: {
                    '0%': { opacity: '0', transform: 'translateX(-20px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' }
                },
                bounceDot: {
                    '0%, 80%, 100%': { transform: 'scale(0)' },
                    '40%': { transform: 'scale(1)' }
                }
            }
        },
    },
    plugins: [],
}
