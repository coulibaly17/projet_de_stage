import * as React from 'react';

declare const Tabs: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> & {
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    orientation?: 'horizontal' | 'vertical';
    dir?: 'ltr' | 'rtl';
    activationMode?: 'automatic' | 'manual';
  } & React.RefAttributes<HTMLDivElement>
>;

declare const TabsList: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'pills' | 'underline';
  } & React.RefAttributes<HTMLDivElement>
>;

declare const TabsTrigger: React.ForwardRefExoticComponent<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    value: string;
    disabled?: boolean;
  } & React.RefAttributes<HTMLButtonElement>
>;

declare const TabsContent: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> & {
    value: string;
  } & React.RefAttributes<HTMLDivElement>
>;

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
};
