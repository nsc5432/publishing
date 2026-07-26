import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:w-4 [&_svg:not([class*='size-'])]:h-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:scale-[0.98]",
    {
        variants: {
            variant: {
                default:
                    'bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30',
                destructive:
                    'bg-destructive text-white shadow-md shadow-destructive/25 hover:bg-destructive/90 hover:shadow-lg focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
                outline:
                    'border border-border/50 bg-background shadow-sm hover:bg-white hover:text-primary hover:border-primary hover:shadow-md transition-colors dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
                secondary:
                    'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md',
                ghost:
                    'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
                link:
                    'text-primary underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-10 px-5 py-2.5 has-[>svg]:pl-2 has-[>svg]:pr-4',
                sm: 'h-9 rounded-lg gap-1.5 px-4 has-[>svg]:px-3',
                lg: 'h-11 rounded-lg px-8 has-[>svg]:px-6 text-base',
                icon: 'w-10 h-10 rounded-lg',
                'icon-sm': 'w-9 h-9 rounded-lg',
                'icon-lg': 'w-11 h-11 rounded-lg',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

function Button({
    className,
    variant,
    size,
    asChild = false,
    ...props
}: React.ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean;
    }) {
    const Comp = asChild ? Slot : 'button';

    return (
        <Comp
            data-slot="button"
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    );
}

export { Button, buttonVariants };
