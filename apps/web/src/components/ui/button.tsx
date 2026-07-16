import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: 'bg-neutral-900 text-white hover:bg-neutral-800',
                destructive: 'bg-red-600 text-white hover:bg-red-700',
                outline: 'border border-neutral-300 bg-white hover:bg-neutral-100',
                secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200',
                ghost: 'hover:bg-neutral-100 hover:text-neutral-900',
                link: 'text-neutral-900 underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-9 px-4 py-2',
                sm: 'h-8 rounded-md px-3 text-xs',
                lg: 'h-10 rounded-md px-6',
                icon: 'h-9 w-9',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
)

function Button({
    className,
    variant,
    size,
    asChild = false,
    ...props
}: React.ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean
    }) {
    const Comp = asChild ? Slot : 'button'

    return (
        <Comp
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    )
}

export { Button, buttonVariants }
