import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, FileText, FileSearch2, Mic2, Video, BarChart3, Newspaper, Settings, LogOut, UserCircle } from 'lucide-react';

export interface NavItem {
  title: string;
  href?: string;
  icon: LucideIcon;
  label?: string;
  disabled?: boolean;
  isChidren?: boolean;
  children?: NavItem[];
  isHeader?: boolean;
}

export const navItems: NavItem[] = [
  {
    title: 'DIE LINKE Suite',
    icon: UserCircle, 
    isHeader: true,
  },
  {
    title: 'Dashboard', // Commonly understood, can remain or change to 'Übersicht'
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Pressemitteilung',
    href: '/press-release',
    icon: FileText,
  },
  {
    title: 'Kleine Anfrage',
    icon: FileSearch2,
    isChidren: true,
    children: [
      {
        title: 'Anfrage erstellen',
        href: '/minor-inquiry/generate',
        icon: FileSearch2, 
      },
      {
        title: 'Anfrage analysieren',
        href: '/minor-inquiry/analyze',
        icon: FileSearch2,
      },
    ],
  },
  {
    title: 'Redenschreiber',
    href: '/speech-writer',
    icon: Mic2,
  },
  {
    title: 'Videoskript',
    href: '/video-script',
    icon: Video,
  },
  {
    title: 'Wettbewerbsstatistiken',
    href: '/competition-stats',
    icon: BarChart3,
  },
  {
    title: 'Aktuelles (Nachrichten)',
    href: '/news',
    icon: Newspaper,
  },
];

export const bottomNavItems: NavItem[] = [
    {
        title: 'Einstellungen',
        href: '/settings',
        icon: Settings,
    },
    {
        title: 'Abmelden',
        href: '/logout', 
        icon: LogOut,
    }
];

    