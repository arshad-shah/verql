import React from 'react'
import { cn } from '../utils/cn'

function TableRoot({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <table className={cn('w-full text-sm', className)} {...props} />
  )
}

function Header({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn('border-b border-border-default bg-bg-secondary', className)} {...props} />
  )
}

function Body({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={cn('[&>tr:not(:last-child)]:border-b [&>tr:not(:last-child)]:border-border-subtle', className)}
      {...props}
    />
  )
}

function Row({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('hover:bg-hover transition-colors duration-[var(--transition-fast)]', className)} {...props} />
  )
}

function Head({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn('text-left text-xs font-medium text-text-secondary px-3 py-2', className)}
      {...props}
    />
  )
}

function Cell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('px-3 py-2 text-text-primary', className)} {...props} />
  )
}

export const Table = Object.assign(TableRoot, {
  Header,
  Body,
  Row,
  Head,
  Cell,
})
