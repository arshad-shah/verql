import React, { ComponentPropsWithRef, ElementType, forwardRef } from 'react'
import { cn } from '../utils/cn'

type SpacingToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type RadiusToken = 'sm' | 'md' | 'lg' | 'full'

const paddingMap: Record<SpacingToken, string> = {
  xs: 'p-1',
  sm: 'p-2',
  md: 'p-3',
  lg: 'p-4',
  xl: 'p-6',
}

const paddingXMap: Record<SpacingToken, string> = {
  xs: 'px-1',
  sm: 'px-2',
  md: 'px-3',
  lg: 'px-4',
  xl: 'px-6',
}

const paddingYMap: Record<SpacingToken, string> = {
  xs: 'py-1',
  sm: 'py-2',
  md: 'py-3',
  lg: 'py-4',
  xl: 'py-6',
}

const radiusMap: Record<RadiusToken, string> = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
}

type BoxOwnProps<E extends ElementType = 'div'> = {
  as?: E
  padding?: SpacingToken
  paddingX?: SpacingToken
  paddingY?: SpacingToken
  radius?: RadiusToken
  className?: string
}

type BoxProps<E extends ElementType = 'div'> = BoxOwnProps<E> &
  Omit<ComponentPropsWithRef<E>, keyof BoxOwnProps<E>>

function BoxInner<E extends ElementType = 'div'>(
  { as, padding, paddingX, paddingY, radius, className, ...props }: BoxProps<E>,
  ref: React.Ref<Element>
) {
  const Component = (as ?? 'div') as ElementType
  return (
    <Component
      ref={ref}
      className={cn(
        padding && paddingMap[padding],
        paddingX && paddingXMap[paddingX],
        paddingY && paddingYMap[paddingY],
        radius && radiusMap[radius],
        className
      )}
      {...props}
    />
  )
}

export const Box = forwardRef(BoxInner) as <E extends ElementType = 'div'>(
  props: BoxProps<E>
) => React.ReactElement | null
