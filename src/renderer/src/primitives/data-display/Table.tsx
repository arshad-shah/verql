import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const tableHeadVariants = cva(
  'text-left font-medium text-text-secondary',
  {
    variants: {
      size: {
        sm: 'text-xs px-2 py-1',
        md: 'text-xs px-3 py-2',
        lg: 'text-base px-4 py-3',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

const tableCellVariants = cva(
  'text-text-primary',
  {
    variants: {
      size: {
        sm: 'text-xs px-2 py-1',
        md: 'px-3 py-2',
        lg: 'text-base px-4 py-3',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

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

interface HeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement>,
    VariantProps<typeof tableHeadVariants> {}

function Head({ className, size, ...props }: HeadProps) {
  return (
    <th
      className={cn(tableHeadVariants({ size }), className)}
      {...props}
    />
  )
}

interface CellProps
  extends React.TdHTMLAttributes<HTMLTableCellElement>,
    VariantProps<typeof tableCellVariants> {}

function Cell({ className, size, ...props }: CellProps) {
  return (
    <td className={cn(tableCellVariants({ size }), className)} {...props} />
  )
}

export const Table = Object.assign(TableRoot, {
  Header,
  Body,
  Row,
  Head,
  Cell,
})
