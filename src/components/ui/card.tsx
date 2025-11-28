import { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export const Card = ({ children, className = '', ...props }: CardProps) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-md p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardHeader = ({
  children,
  className = '',
  ...props
}: CardProps) => {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

export const CardTitle = ({
  children,
  className = '',
  ...props
}: CardProps) => {
  return (
    <h3 className={`text-xl font-semibold ${className}`} {...props}>
      {children}
    </h3>
  )
}

export const CardContent = ({
  children,
  className = '',
  ...props
}: CardProps) => {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

