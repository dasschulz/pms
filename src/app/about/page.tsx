'use client';

import React from 'react';
import { BentoGrid } from '@/components/ui/bento-grid';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
  IconInfoCircle, 
  IconCode,       
  IconWebhook,
  IconTrain,
  IconFileText,
  IconCalendar,
  IconQuestionMark,
} from '@tabler/icons-react';

const markdownContent = `
Linksfraktion Studio Webapp
**Felix S. Schulz** <mailto:heidi.reichinnek.ma02@bundestag.de>, Büro Reichinnek <br>
<a href="https://nextjs.org">Next.js</a>/<a href="https://react.dev">React</a>/<a href="https://tailwindcss.com">Tailwind CSS</a>/<a href="https://vercel.com">Vercel</a>/<a href="https://airtable.com">Airtable</a>

Gegner-Recherche
<a href="https://www.abgeordnetenwatch.de/api">Abgeordnetenwatch API</a>/<a href="https://www.mediawiki.org/wiki/API:Main_page">Wikipedia API</a>/<a href="https://www.anthropic.com">Anthropic</a>

Dokumentenrecherche
**Deutscher Bundestag**, Dokumentations- und Informationssystem für Parlamentsmaterialien <br>
<a href="https://dip.bundestag.de/%C3%BCber-dip/hilfe/api">DIP API</a>

Tagesordnung
**Jannis Hutt** <mailto:jannis.hutt@dielinkebt.de>, Linksfraktion <br>
<a href="https://github.com/hutt/bt-to/tree/main">BT-TO API @ github</a>

IFG-Anfragen
<a href="https://fragdenstaat.de/api/">Fragdenstaat API</a>

Zugverbindungen
**Deutsche Bahn**, Fahrplanauskunft und Echtzeitdaten <br>
<a href="https://github.com/public-transport/hafas-client">HAFAS API</a>
`;

// Map titles to their corresponding images
const getImageForTitle = (title: string) => {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('linksfraktion') || titleLower.includes('webapp')) {
    return '/images/apis/nextjs.jpg'; // Main framework
  }
  if (titleLower.includes('gegner-recherche')) {
    return '/images/apis/abgeordnetenwatch.jpg'; // Primary API for this section
  }
  if (titleLower.includes('dokumentenrecherche')) {
    return '/images/apis/dip.jpg';
  }
  if (titleLower.includes('tagesordnung')) {
    return '/images/apis/bttoapi.jpg';
  }
  if (titleLower.includes('ifg-anfragen')) {
    return '/images/apis/wiki.jpg'; // Use wiki as fallback for government/transparency
  }
  if (titleLower.includes('zugverbindungen')) {
    return '/images/apis/react.jpg'; // Use React as tech fallback
  }
  
  return '/images/apis/nextjs.jpg'; // Default fallback
};

const ApiImage = ({ title }: { title: string }) => {
  const imageSrc = getImageForTitle(title);
  
  return (
    <div className="flex flex-1 w-full h-[6rem] min-h-[6rem] rounded-xl overflow-hidden border border-neutral-100 dark:border-neutral-800">
      <Image
        src={imageSrc}
        alt={`${title} API`}
        width={200}
        height={96}
        className="w-full h-full object-cover"
      />
    </div>
  );
};

const parseLine = (line: string): React.ReactNode[] => {
  const nodes: React.ReactNode[] = [];
  
  // Handle mailto links in the format: <mailto:email>text</mailto>
  let workingLine = line.replace(/<mailto:([^>]+)>([^<]+)<\/mailto>/g, (match, email, text) => {
    return `[MAILTO:${email}:${text}]`;
  });
  
  // Handle regular links in the format: <a href="url">text</a>
  workingLine = workingLine.replace(/<a\s+href="([^"]*)"[^>]*>([^<]+)<\/a>/g, (match, url, text) => {
    return `[LINK:${url}:${text}]`;
  });
  
  // Handle bold text
  workingLine = workingLine.replace(/\*\*([^*]+)\*\*/g, '[BOLD:$1]');
  
  // Split by our custom tokens
  const parts = workingLine.split(/(\[(?:MAILTO|LINK|BOLD):[^\]]+\])/);
  
  parts.forEach((part, index) => {
    if (part.startsWith('[MAILTO:')) {
      const matches = part.match(/\[MAILTO:([^:]+):([^\]]+)\]/);
      if (matches) {
        const [, email, text] = matches;
        nodes.push(
          <a 
            key={`mailto-${index}`}
            href={`mailto:${email}`}
            className="text-blue-500 hover:underline"
          >
            {text}
          </a>
        );
      }
    } else if (part.startsWith('[LINK:')) {
      const matches = part.match(/\[LINK:([^:]+):([^\]]+)\]/);
      if (matches) {
        const [, url, text] = matches;
        nodes.push(
          <a 
            key={`link-${index}`}
            href={url}
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {text}
          </a>
        );
      }
    } else if (part.startsWith('[BOLD:')) {
      const matches = part.match(/\[BOLD:([^\]]+)\]/);
      if (matches) {
        nodes.push(<strong key={`bold-${index}`}>{matches[1]}</strong>);
      }
    } else if (part) {
      nodes.push(part);
    }
  });
  
  return nodes;
};

const parseDescription = (descriptionText: string): React.ReactNode[] => {
  const overallNodes: React.ReactNode[] = [];
  const lines = descriptionText.split(/<br\s*\/?>|\n/g);

  lines.forEach((line, index) => {
    if (line.trim()) {
      overallNodes.push(...parseLine(line));
    }
    if (index < lines.length - 1 && line.trim()) {
      overallNodes.push(<br key={`br-${index}`} />);
    }
  });
  
  return overallNodes;
};

const getIcon = (title: string) => {
  if (title.toLowerCase().includes('zugverbindungen')) return <IconTrain className="h-4 w-4 text-neutral-500" />;
  if (title.toLowerCase().includes('dokumentenrecherche')) return <IconFileText className="h-4 w-4 text-neutral-500" />;
  if (title.toLowerCase().includes('tagesordnung')) return <IconCalendar className="h-4 w-4 text-neutral-500" />;
  if (title.toLowerCase().includes('ifg-anfragen')) return <IconQuestionMark className="h-4 w-4 text-neutral-500" />;
  if (title.toLowerCase().includes('webapp') || title.toLowerCase().includes('studio')) return <IconCode className="h-4 w-4 text-neutral-500" />;
  if (title.toLowerCase().includes('recherche')) return <IconWebhook className="h-4 w-4 text-neutral-500" />;
  return <IconInfoCircle className="h-4 w-4 text-neutral-500" />;
}

// Custom BentoGridItem without hover movement
const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "group/bento shadow-input row-span-1 flex flex-col justify-between space-y-4 rounded-xl border border-neutral-200 bg-white p-4 transition duration-200 hover:shadow-xl dark:border-white/[0.2] dark:bg-black dark:shadow-none",
        className,
      )}
    >
      {header}
      <div>
        {icon}
        <div className="mt-2 mb-2 font-sans font-bold text-neutral-600 dark:text-neutral-200">
          {title}
        </div>
        <div className="font-sans text-xs font-normal text-neutral-600 dark:text-neutral-300">
          {description}
        </div>
      </div>
    </div>
  );
};

export default function AboutPage() {
  const rawItems = markdownContent.trim().split('\n\n');
  
  const items = rawItems.map((item, i) => {
    const lines = item.split('\n');
    const title = lines[0];
    const descriptionString = lines.slice(1).join('\n');
    return {
      title: title,
      description: parseDescription(descriptionString),
      header: <ApiImage title={title} />,
      icon: getIcon(title),
      className: "", // Default, will be overridden by processedItems logic below
    };
  });

  const processedItems = items.map((item, index, arr) => {
    let className = item.className;
    if (arr.length === 4) {
        if (index === 3) className = "md:col-span-3";
        else className = ""; 
    } else if (arr.length % 3 === 1 && index === arr.length - 1) {
        className = "md:col-span-3";
    } else if (arr.length % 3 === 2 && index >= arr.length -2) {
        className = "md:col-span-1"; 
    }
    return { ...item, className }; 
  });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">About This Project</h1>
      <BentoGrid className="max-w-7xl mx-auto md:grid-cols-3">
        {processedItems.map((item, i) => (
          <BentoGridItem
            key={i}
            title={item.title}
            description={item.description}
            header={item.header}
            icon={item.icon}
            className={item.className}
          />
        ))}
      </BentoGrid>
    </div>
  );
} 