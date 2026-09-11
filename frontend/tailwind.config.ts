import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					hover: 'hsl(var(--primary-hover))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				// Luxury Theme Colors
				lux: {
					platinum: 'hsl(var(--lux-platinum))',
					gold: 'hsl(var(--lux-gold))',
					rose: 'hsl(var(--lux-rose))',
					midnight: 'hsl(var(--lux-midnight))',
					pearl: 'hsl(var(--lux-pearl))',
					crystal: 'hsl(var(--lux-crystal))',
					ember: 'hsl(var(--lux-ember))',
					velvet: 'hsl(var(--lux-velvet))'
				},
				medical: {
					blue: 'hsl(var(--medical-blue))',
					green: 'hsl(var(--health-green))',
					purple: 'hsl(var(--meeting-purple))',
					amber: 'hsl(var(--knowledge-amber))'
				},
				tech: {
					cyan: 'hsl(var(--tech-cyan))',
					violet: 'hsl(var(--innovation-violet))',
					glow: 'hsl(var(--primary-glow))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				kanban: {
					planning: 'hsl(var(--kanban-planning))',
					'planning-border': 'hsl(var(--kanban-planning-border))',
					week: 'hsl(var(--kanban-week))',
					'week-border': 'hsl(var(--kanban-week-border))',
					today: 'hsl(var(--kanban-today))',
					'today-border': 'hsl(var(--kanban-today-border))',
					done: 'hsl(var(--kanban-done))',
					'done-border': 'hsl(var(--kanban-done-border))'
				},
				priority: {
					urgent: 'hsl(var(--priority-urgent))',
					'urgent-border': 'hsl(var(--priority-urgent-border))',
					high: 'hsl(var(--priority-high))',
					'high-border': 'hsl(var(--priority-high-border))',
					medium: 'hsl(var(--priority-medium))',
					'medium-border': 'hsl(var(--priority-medium-border))',
					low: 'hsl(var(--priority-low))',
					'low-border': 'hsl(var(--priority-low-border))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
			'twinkle': {
				'0%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
				'50%': { opacity: '1', transform: 'scale(1.2)' }
			},
			'mora-blink': {
				'0%, 90%, 100%': { transform: 'scaleY(1)' },
				'95%': { transform: 'scaleY(0.1)' }
			},
			'mora-float': {
				'0%, 100%': { transform: 'translateY(0)' },
				'50%': { transform: 'translateY(-4px)' }
			},
			'mora-glow': {
				'0%, 100%': { opacity: '0.6' },
				'50%': { opacity: '1' }
			}
		},
		animation: {
			'accordion-down': 'accordion-down 0.2s ease-out',
			'accordion-up': 'accordion-up 0.2s ease-out',
			'fade-in': 'modernFadeIn 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
			'slide-up': 'modernSlideUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
			'bounce-subtle': 'modernBounce 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
			'scale-in': 'scaleIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
			'blur-in': 'blurIn 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
			'float': 'floatingGlow 3s ease-in-out infinite',
			'pulse-glow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
			'skeleton': 'loading 1.5s infinite',
			'twinkle': 'twinkle 2.5s ease-in-out infinite',
			'mora-blink': 'mora-blink 3.5s ease-in-out infinite',
			'mora-float': 'mora-float 3s ease-in-out infinite',
			'mora-glow': 'mora-glow 2s ease-in-out infinite'
		},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-medical': 'var(--gradient-medical)',
				'gradient-professional': 'var(--gradient-professional)',
				'gradient-subtle': 'var(--gradient-subtle)',
				'gradient-card': 'var(--gradient-card)',
				'gradient-glass': 'var(--gradient-glass)',
				'gradient-glow': 'var(--gradient-glow)',
				'gradient-hero': 'var(--gradient-hero)',
				'gradient-futuristic': 'var(--gradient-futuristic)',
				'gradient-lux': 'var(--gradient-lux)',
				'gradient-luxury-gold': 'var(--gradient-luxury-gold)',
				'gradient-luxury-rose': 'var(--gradient-luxury-rose)',
				'gradient-luxury-platinum': 'var(--gradient-luxury-platinum)',
				'gradient-luxury-ember': 'var(--gradient-luxury-ember)'
			},
			boxShadow: {
				'elegant': 'var(--shadow-elegant)',
				'medical': 'var(--shadow-medical)',
				'card': 'var(--shadow-card)',
				'glass': 'var(--shadow-glass)',
				'floating': 'var(--shadow-floating)',
				'glow': 'var(--shadow-glow)',
				'luxury': 'var(--shadow-luxury)',
				'luxury-glow': 'var(--shadow-luxury-glow)',
				'luxury-soft': 'var(--shadow-luxury-soft)',
				'luxury-deep': 'var(--shadow-luxury-deep)'
			},
			fontFamily: {
				'sans': ['Vazirmatn', 'sans-serif'],
				'display': ['Vazirmatn', 'sans-serif'],
				'body': ['Vazirmatn', 'sans-serif'],
				'vazir': ['Vazirmatn', 'sans-serif'],
				'persian': ['Vazirmatn', 'sans-serif'],
				'mono': ['Vazirmatn', 'monospace'],
				'futuristic': ['Vazirmatn', 'sans-serif']
			},
			fontSize: {
				'xs': ['0.6875rem', { lineHeight: '1rem' }],
				'sm': ['0.75rem', { lineHeight: '1.125rem' }],
				'base': ['0.875rem', { lineHeight: '1.375rem' }],
				'lg': ['1rem', { lineHeight: '1.5rem' }],
				'xl': ['1.125rem', { lineHeight: '1.625rem' }],
				'2xl': ['1.25rem', { lineHeight: '1.75rem' }],
				'3xl': ['1.5rem', { lineHeight: '2rem' }],
				'4xl': ['1.875rem', { lineHeight: '2.25rem' }],
				'5xl': ['2.25rem', { lineHeight: '1' }],
				'6xl': ['3rem', { lineHeight: '1' }],
				'7xl': ['3.75rem', { lineHeight: '1' }],
				'8xl': ['4.5rem', { lineHeight: '1' }],
				'9xl': ['6rem', { lineHeight: '1' }]
			},
			letterSpacing: {
				'tighter': '-0.05em',
				'tight': '-0.025em',
				'normal': '0em',
				'wide': '0.025em',
				'wider': '0.05em',
				'widest': '0.1em'
			}
		}
	},
	plugins: [
		tailwindcssAnimate,
		function ({ addVariant }: any) {
			addVariant('rtl', '[dir="rtl"] &');
			addVariant('ltr', '[dir="ltr"] &');
		}
	],
} satisfies Config;
