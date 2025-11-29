import { ButtonHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
      secondary: 'bg-gray-800 text-white hover:bg-gray-900',
      outline: 'border-2 border-gray-200 bg-transparent hover:bg-gray-50 text-gray-900',
      ghost: 'bg-transparent hover:bg-gray-100 text-gray-700',
    }

    return (
      <button
        ref={ref}
        className={twMerge(
          'inline-flex items-center justify-center rounded-lg px-4 py-3 text-base font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          className
        )}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

