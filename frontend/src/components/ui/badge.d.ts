import * as React from 'react';

declare const Badge: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
  } & React.RefAttributes<HTMLDivElement>
>;

declare const badgeVariants: any; // Vous pouvez typer cela plus précisément si nécessaire

export { Badge, badgeVariants };
