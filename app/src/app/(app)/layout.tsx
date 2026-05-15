'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, TrendingUp, PlusCircle, User } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Today' },
    { href: '/trends', icon: TrendingUp, label: 'Trends' },
    { href: '/log', icon: PlusCircle, label: 'Log' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh' }}>
      <div className="page-content">
        {children}
      </div>
      <nav className="bottom-nav" aria-label="Main navigation">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={pathname === href ? 'active' : ''}
          >
            <Icon size={22} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
