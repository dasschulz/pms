import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, FileText, FileSearch2, Mic2, Video, BarChart3, Newspaper, Mail, Settings, LogOut, UserCircle, CalendarDays, Share2, Calendar, TrendingUp, Image, MapPin } from 'lucide-react';

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
    title: 'Touranfragen',
    href: '/touranfragen',
    icon: MapPin,
  },
  {
    title: 'Dokumentensuche',
    href: '/dokumentensuche',
    icon: FileSearch2,
  },
  {
    title: 'Tscheka',
    href: '/gegner-recherche',
    icon: FileSearch2,
  },
  {
    title: 'Fragewesen',
    icon: FileSearch2,
    isChidren: true,
    children: [
      {
        title: 'Kleine Anfragen',
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
      {
        title: 'IFG-Anfragen',
        href: '/ifg',
        icon: FileSearch2,
      },
    ],
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
        href: '/meine-reden',
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
        title: 'Bürgerpost',
        href: '/buergerpost',
        icon: Mail,
      },
    ],
  },
  {
    title: 'Social Media',
    icon: Share2,
    isChidren: true,
    children: [
      {
        title: 'Skriptgenerator',
        href: '/skriptgenerator',
        icon: Video,
      },
      {
        title: 'Redaktionsplan',
        href: '/redaktionsplan',
        icon: Calendar,
      },
      {
        title: 'Tracking',
        href: '/tracking',
        icon: TrendingUp,
      },
      {
        title: 'Sharepics',
        href: '/sharepics',
        icon: Image,
      },
    ],
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

    