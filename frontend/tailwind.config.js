/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: [
  				'Figtree',
  				'system-ui',
  				'sans-serif'
  			],
  			display: [
  				'Outfit',
  				'ui-sans-serif',
  				'system-ui'
  			],
  			alt: [
  				'Rubik',
  				'ui-sans-serif',
  				'system-ui'
  			],
  			soft: [
  				'Barlow',
  				'ui-sans-serif',
  				'system-ui'
  			],
  			tech: [
  				'IBM Plex Sans',
  				'ui-sans-serif',
  				'system-ui'
  			],
  			mono: [
  				'Inconsolata',
  				'ui-monospace',
  				'monospace'
  			],
  			nunito: [
  				'Nunito',
  				'ui-sans-serif',
  				'system-ui'
  			]
  		},
  		fontWeight: {
  			light: '300',
  			normal: '400',
  			medium: '500',
  			semibold: '600',
  			bold: '700',
  			extrabold: '800',
  			black: '900'
  		},
  		colors: {
  			primary: {
  				'50': '#f0f8f5',
  				'100': '#ddf0eb',
  				'200': '#c1e6ca',
  				'300': '#a5ddb0',
  				'400': '#6bc86f',
  				'500': '#34a83a',
  				'600': '#2d9432',
  				'700': '#26802a',
  				'800': '#1f6c23',
  				'900': '#1a581d',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			accent: {
  				'50': '#fff9f0',
  				'100': '#ffe0b2',
  				'200': '#ffc880',
  				'300': '#ffb74d',
  				'400': '#ffa726',
  				'500': '#ff9800',
  				'600': '#f57c00',
  				'700': '#e65100',
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			secondary: {
  				'500': '#2196f3',
  				'600': '#1976d2',
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		spacing: {
  			xs: '0.5rem',
  			sm: '0.75rem',
  			md: '1rem',
  			lg: '1.25rem',
  			xl: '1.5rem',
  			'2xl': '2rem'
  		},
  		borderRadius: {
  			none: '0',
  			sm: 'calc(var(--radius) - 4px)',
  			md: 'calc(var(--radius) - 2px)',
  			lg: 'var(--radius)',
  			xl: '16px',
  			'2xl': '20px'
  		},
  		keyframes: {
  			slideIn: {
  				from: {
  					transform: 'translateX(400px)',
  					opacity: '0'
  				},
  				to: {
  					transform: 'translateX(0)',
  					opacity: '1'
  				}
  			},
  			slideUp: {
  				from: {
  					transform: 'translateY(20px)',
  					opacity: '0'
  				},
  				to: {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
  			bounceScale: {
  				'0%, 80%, 100%': {
  					transform: 'scale(0)'
  				},
  				'40%': {
  					transform: 'scale(1)'
  				}
  			},
  			softPulse: {
  				'0%, 100%': {
  					opacity: '1'
  				},
  				'50%': {
  					opacity: '0.7'
  				}
  			},
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
  			}
  		},
  		animation: {
  			'slide-in': 'slideIn 0.3s ease-out',
  			'slide-up': 'slideUp 0.3s ease-out',
  			'bounce-scale': 'bounceScale 1s ease-in-out',
  			'soft-pulse': 'softPulse 1.5s ease-in-out infinite',
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
  		boxShadow: {
  			md: '0 4px 12px rgba(0, 0, 0, 0.08)',
  			lg: '0 6px 20px rgba(0, 0, 0, 0.12)',
  			xl: '0 10px 40px rgba(0, 0, 0, 0.2)'
  		},
  		transitionProperty: {
  			DEFAULT: 'color, background-color, border-color, fill, stroke, opacity, box-shadow, transform'
  		},
  		screens: {
  			sm_md: '680px',
  			assessmentComparisonFooter: '864px'
  		},
  		transitionTimingFunction: {
  			soft: 'cubic-bezier(0.4, 0, 0.2, 1)'
  		}
  	}
  },
  plugins: [require('tailwindcss-animate')],
};
