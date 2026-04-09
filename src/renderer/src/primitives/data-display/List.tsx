import React from 'react'
import { cn } from '../utils/cn'

function ListRoot({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul className={cn('flex flex-col', className)} {...props} />
  )
}

function Item({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) {
  return (
    <li className={cn('px-3 py-2 text-sm text-text-primary transition-colors duration-[var(--transition-fast)]', className)} {...props} />
  )
}

export const List = Object.assign(ListRoot, { Item })
