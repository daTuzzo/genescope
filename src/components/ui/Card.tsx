'use client'

import { cn } from '@/lib/utils'
import { HTMLAttributes, forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-card border border-border rounded-xl p-6 transition-all duration-200',
        hover && 'hover:bg-card-hover hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 cursor-pointer',
        className
      )}
      {...props}
    />
  )
)

Card.displayName = 'Card'

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mb-4', className)} {...props} />
  )
)

CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-semibold text-foreground', className)} {...props} />
  )
)

CardTitle.displayName = 'CardTitle'

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
)

CardContent.displayName = 'CardContent'

export { Card, CardHeader, CardTitle, CardContent }
