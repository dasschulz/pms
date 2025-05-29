'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconHome } from '@tabler/icons-react';
import { navItems, type NavItem } from '@/lib/nav-items'; // Import navItems and NavItem type

const ChevronRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="size-4 rtl:rotate-180"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

export interface BreadcrumbItem {
  label: React.ReactNode;
  href: string;
}

// Helper function to find the parent category of a given path
const findCategoryForPath = (path: string, items: NavItem[]): NavItem | null => {
  for (const item of items) {
    if (item.isChidren && item.children) {
      for (const child of item.children) {
        if (child.href === path) {
          return item; // This is the parent category
        }
      }
    }
  }
  return null;
};

// Helper function to find nav item title by href
const findNavItemTitle = (href: string, items: NavItem[]): string | null => {
  // Check top-level items
  for (const item of items) {
    if (item.href === href) {
      return item.title;
    }
    // Check children if they exist
    if (item.children) {
      for (const child of item.children) {
        if (child.href === href) {
          return child.title;
        }
      }
    }
  }
  return null;
};

export const Breadcrumbs: React.FC = () => {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(segment => segment);

  const generatedBreadcrumbs: BreadcrumbItem[] = pathSegments.map((segment, index) => {
    const href = '/' + pathSegments.slice(0, index + 1).join('/');
    
    // Try to find the correct title from nav items, fallback to auto-generated
    const navTitle = findNavItemTitle(href, navItems);
    const label = navTitle || (segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '));
    
    return { label, href };
  });

  if (generatedBreadcrumbs.length === 0 && pathname === '/') {
    return null; 
  }

  const homeBreadcrumb: BreadcrumbItem = { 
    label: <IconHome className="size-4" />,
    href: "/" 
  };

  let itemsToDisplay = [homeBreadcrumb, ...generatedBreadcrumbs];

  // Check if the current page (last breadcrumb) has a category
  if (generatedBreadcrumbs.length > 0) {
    const currentPageHref = generatedBreadcrumbs[generatedBreadcrumbs.length - 1].href;
    const category = findCategoryForPath(currentPageHref, navItems);

    if (category && category.href) { // Ensure category itself can be a link
      const categoryBreadcrumb: BreadcrumbItem = {
        label: category.title,
        href: category.href, // Make category clickable if it has an href
      };
      // Insert category before the current page breadcrumb
      // If homeBreadcrumb is present, insert after it.
      itemsToDisplay.splice(1, 0, categoryBreadcrumb);
    } else if (category) {
        // Category exists but is not a link itself, add as non-clickable text or a specific representation
        const categoryBreadcrumb: BreadcrumbItem = {
            label: category.title, // Display title
            href: "#", // Non-functional href or handle differently
        };
        // Potentially, we might not want non-clickable items in a breadcrumb trail
        // For now, let's assume if a category is found, it's inserted. Adjust if needed.
        itemsToDisplay.splice(1, 0, categoryBreadcrumb);
    }
  }
  // Remove duplicate consecutive breadcrumbs by href (e.g. if category.href is same as next item)
  itemsToDisplay = itemsToDisplay.filter((item, index, self) =>
    index === 0 || item.href !== self[index - 1].href
  );


  return (
    <nav aria-label="Breadcrumb" className="flex-grow">
      <ol className="flex items-center justify-center gap-1 text-sm text-gray-600 dark:text-gray-300">
        {itemsToDisplay.map((item, index) => (
          <li key={item.href + '-' + index} className="flex items-center"> {/* Ensure key is unique even if hrefs are temporarily non-unique before filter */} 
            <Link
              href={item.href}
              className={`block transition hover:text-gray-700 dark:hover:text-gray-200 ${item.href === '#' ? 'pointer-events-none text-gray-400 dark:text-gray-500' : ''}`}
              aria-label={typeof item.label === 'string' ? item.label : (item.href === '/' ? 'Home' : 'Category')}
            >
              {item.label}
            </Link>
            {index < itemsToDisplay.length - 1 && (
              <span className="mx-1">
                <ChevronRightIcon />
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}; 