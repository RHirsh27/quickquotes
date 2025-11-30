'use client'

import { ButtonHTMLAttributes } from 'react'
import { Button } from './button'
import { LoadingSpinner } from './LoadingSpinner'

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
  children: React.ReactNode
}

export function LoadingButton({
  loading = false,
  loadingText,
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={loading || disabled}
      className={className}
      {...props}
    >
      {loading && (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          {loadingText || 'Loading...'}
        </>
      )}
      {!loading && children}
    </Button>
  )
}

