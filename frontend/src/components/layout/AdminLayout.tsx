import type { ReactNode } from 'react';
import { AppLayout } from './AppLayout';

type AdminLayoutProps = {
  children: ReactNode;
};

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AppLayout className="bg-gray-100">
      {children}
    </AppLayout>
  );
}

export default AdminLayout;
