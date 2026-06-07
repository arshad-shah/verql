import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const listItemVariants = cva(
  'text-text-primary transition-colors duration-[var(--transition-fast)]',
  {
    variants: {
      size: {
        sm: 'text-xs py-1 px-2',
        md: 'text-sm py-2 px-3',
        lg: 'text-base py-3 px-4',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

function ListRoot({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul className={cn('flex flex-col', className)} {...props} />
  )
}

interface ItemProps
  extends React.HTMLAttributes<HTMLLIElement>,
    VariantProps<typeof listItemVariants> {}

function Item({ className, size, ...props }: ItemProps) {
  return (
    <li className={cn(listItemVariants({ size }), className)} {...props} />
  )
}

export const List = Object.assign(ListRoot, { Item })
