import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, FileText, FileSearch2, Mic2, Video, BarChart3, Newspaper, Mail, Settings, LogOut, UserCircle, CalendarDays, Share2, Calendar, TrendingUp, Image, MapPin, Clapperboard, ClipboardList, Building2, Mountain, Code, Plane, Users, CalendarCheck, Phone, Shield, UserPlus } from 'lucide-react';

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
    title: 'Draußenwelt',
    icon: Mountain,
    isChidren: true,
    children: [
      {
        title: 'BPA-Fahrten',
        href: '/bpa-fahrten',
        icon: ClipboardList,
      },
      {
        title: 'Touranfragen',
        href: '/touranfragen',
        icon: MapPin,
      },
    ],
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
    children: [],
  },
  {
    title: 'Reden',
    icon: Mic2,
    isChidren: true,
    children: [
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
    children: [],
  },
  {
    title: 'Social Media',
    icon: Share2,
    isChidren: true,
    children: [
      {
        title: 'Videoplanung',
        href: '/videoplanung',
        icon: Clapperboard,
      },
    ],
  },
  {
    title: 'Dev',
    icon: Code,
    isChidren: true,
    children: [
      {
        title: 'Alle Wahlkreisbüros',
        href: '/alle-wahlkreisbueros',
        icon: Building2,
      },
      {
        title: 'Dienstreisen',
        href: '/dienstreisen',
        icon: Plane,
      },
      {
        title: 'Referentenpool',
        href: '/referentenpool',
        icon: Users,
      },
      {
        title: 'Journalistenpool',
        href: '/journalistenpool',
        icon: Newspaper,
      },
      {
        title: 'Anfragenplanung',
        href: '/anfragenplanung',
        icon: CalendarCheck,
      },
      {
        title: 'Transparenz',
        href: '/transparenz',
        icon: Shield,
      },
      {
        title: 'Raumbuchung',
        href: '/raumbuchung',
        icon: CalendarDays,
      },
      {
        title: 'Besucheranmeldung',
        href: '/besucheranmeldung',
        icon: UserPlus,
      },
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
      {
        title: 'Redenschreiber',
        href: '/redenschreiber',
        icon: Mic2,
      },
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
      {
        title: 'Wahlkreisbüros',
        href: '/wahlkreisbueros',
        icon: Building2,
      },
    ],
  },
];

// Conditional navigation items based on user permissions
export const getFraktionsvorstandNavItems = (): NavItem[] => [
  {
    title: 'Fraktionsvorstand',
    icon: Phone,
    isChidren: true,
    children: [
      {
        title: 'Fraktionsruf',
        href: '/fraktionsruf',
        icon: Phone,
      },
    ],
  },
];

export const getNavItemsForUser = (isFraktionsvorstand?: boolean): NavItem[] => {
  const baseNavItems = [...navItems];
  
  if (isFraktionsvorstand) {
    // Find the index of the Dev section
    const devIndex = baseNavItems.findIndex(item => item.title === 'Dev');
    if (devIndex !== -1) {
      // Insert Fraktionsvorstand section before Dev
      baseNavItems.splice(devIndex, 0, ...getFraktionsvorstandNavItems());
    } else {
      // If Dev section not found, add at the end
      baseNavItems.push(...getFraktionsvorstandNavItems());
    }
  }
  
  return baseNavItems;
};

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

    