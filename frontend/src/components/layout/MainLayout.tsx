import type { ReactNode } from 'react';
import { PublicLayout } from './PublicLayout';

type MainLayoutProps = {
  children: ReactNode;
};

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <PublicLayout>
      {children}
    </PublicLayout>
  );
}

export default MainLayout;
