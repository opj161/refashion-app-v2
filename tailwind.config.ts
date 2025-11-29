import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
					"gradient-end": "hsl(var(--primary-gradient-end))",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
			},
			'progress-completion': {
				'0%': { backgroundColor: 'hsl(var(--primary))' },
				'50%': { backgroundColor: 'hsl(142, 76%, 36%)', boxShadow: '0 0 20px rgba(34, 197, 94, 0.5)' },
				'100%': { backgroundColor: 'hsl(142, 76%, 36%)', boxShadow: '0 0 10px rgba(34, 197, 94, 0.3)' }
			},
			// Enhanced motion animations
			'spring-quick': {
				'0%': { transform: 'scale(0)' },
				'100%': { transform: 'scale(1)' }
			},
			'spring-standard': {
				'0%': { transform: 'scale(0)' },
				'100%': { transform: 'scale(1)' }
			},
			'bounce-subtle': {
				'0%': { transform: 'translateY(0)' },
				'50%': { transform: 'translateY(-20px)' },
				'100%': { transform: 'translateY(0)' }
			},
			'shimmer': {
				'0%, 100%': { backgroundPosition: '-100% 0' },
				'50%': { backgroundPosition: '100% 0' },
			},
		},
		animation: {
			'accordion-down': 'accordion-down 0.2s ease-out',
			'accordion-up': 'accordion-up 0.2s ease-out',
			'progress-ribbings': 'progress-ribbings 2s linear infinite',
			'progress-pulsation': 'progress-pulsation 1.5s infinite',
			'progress-completion': 'progress-completion 1s ease-in-out',
			// Enhanced motion animations
			'spring-quick': 'spring-quick var(--motion-spring-quick)',
			'spring-standard': 'spring-standard var(--motion-spring-standard)',
			'bounce-subtle': 'bounce-subtle var(--motion-bounce-subtle)',
			'shimmer': 'shimmer 3s infinite linear',
		},
		fontFamily: {
			sans: ['var(--font-satoshi)', 'sans-serif'],
		},
		// Add custom scale utilities for modern hover effects
		borderRadius: {
			lg: "var(--radius)",
			md: "calc(var(--radius) - 2px)",
			sm: "calc(var(--radius) - 4px)",
		},
		scale: {
			'102': '1.02',
		}
	},
	plugins: [require("tailwindcss-animate")],
};
