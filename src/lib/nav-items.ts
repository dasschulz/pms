import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, FileText, FileSearch2, Mic2, Video, BarChart3, Newspaper, Mail, Settings, LogOut, UserCircle, CalendarDays } from 'lucide-react';

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
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'News',
    href: '/news',
    icon: Newspaper,
  },
  {
    title: 'Tagesordnung',
    href: '/tagesordnung',
    icon: CalendarDays,
  },
  {
    title: 'Fragewesen',
    icon: FileSearch2,
    isChidren: true,
    children: [
      {
        title: 'Anfrage erstellen',
        href: '/kleine-anfragen/generate',
        icon: FileSearch2,
      },
      {
        title: 'Anfrage analysieren',
        href: '/kleine-anfragen/analyze',
        icon: FileSearch2,
      },
      {
        title: 'Meine Anfragen',
        href: '/kleine-anfragen',
        icon: FileSearch2,
      },
      {
        title: 'Schriftliche Fragen',
        href: '/schriftliche-fragen',
        icon: FileSearch2,
      },
    ],
  },
  {
    title: 'Dokumentensuche',
    href: '/dokumentensuche',
    icon: FileSearch2,
  },
  {
    title: 'Reden',
    icon: Mic2,
    isChidren: true,
    children: [
      {
        title: 'Redenschreiber',
        href: '/redenschreiber',
        icon: Mic2,
      },
      {
        title: 'Meine Reden',
        href: '/reden',
        icon: Mic2,
      },
    ],
  },
  {
    title: 'Kommunikation',
    icon: FileText,
    isChidren: true,
    children: [
      {
        title: 'PM-Generator',
        href: '/pressemitteilung',
        icon: FileText,
      },
      {
        title: 'Skriptgenerator',
        href: '/skriptgenerator',
        icon: Video,
      },
      {
        title: 'Bürgerpost',
        href: '/buergerpost',
        icon: Mail,
      },
    ],
  },
  {
    title: 'Wettbewerbsstatistiken',
    href: '/wettbewerbsstatistiken',
    icon: BarChart3,
  },
  {
    title: 'Gegner-Recherche',
    href: '/gegner-recherche',
    icon: FileSearch2,
  },
];

export const bottomNavItems: NavItem[] = [
  {
    title: 'Einstellungen',
    href: '/einstellungen',
    icon: Settings,
  },
];

export const signOutNavItem: NavItem = {
  title: 'Abmelden',
  href: '/abmelden',
  icon: LogOut,
};

    