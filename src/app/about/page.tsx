'use client';

import React from 'react';
import { BentoGrid } from '@/components/ui/bento-grid';
import { cn } from '@/lib/utils';
import {
  IconInfoCircle, 
  IconUsers,      
  IconApi,        
  IconCode,       
  IconWebhook,
  IconTrain,
  IconFileText,
  IconCalendar,
// IconLink, // Not used directly, links are parsed
// IconMail, // Not used directly, mailtos are parsed
} from '@tabler/icons-react';

const markdownContent = `
Linksfraktion Studio Webapp
**Felix S. Schulz**(Mailto:heidi.reichinnek.ma02@bundestag.de), Büro Reichinnek <br>
Next.js/React/Tailwind CSS/Vercel/Airtable

Gegner-Recherche
Abgeordnetenwatch API(link to https://www.abgeordnetenwatch.de/api in new tab)/Wikipedia API/Anthropic

Dokumentenrecherche
**Deutscher Bundestag**, Dokumentations- und Informationssystem für Parlamentsmaterialien <br>
DIP API (link to https://dip.bundestag.de/%C3%BCber-dip/hilfe/api in new tab)

Zugverbindungen
**Deutsche Bahn**, Fahrplanauskunft und Echtzeitdaten <br>
HAFAS API (link to https://github.com/public-transport/hafas-client in new tab)

Tagesordnung
**Jannis Hutt**(mailto:jannis.hutt@dielinkebt.de), Linksfraktion <br>
BT-TO API @ github (link to https://github.com/hutt/bt-to/tree/main in new tab)
`;

const Skeleton = () => (
  <div className="flex flex-1 w-full h-[6rem] min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100"></div>
);

const parseLine = (line: string): React.ReactNode[] => {
  const nodes: React.ReactNode[] = [];
  const tokenRegex = /(\*\*.*?\*\*|\(link to [^)]+\)|\(mailto:[^)]+\))/g;
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(line)) !== null) {
    const textBeforeMatch = line.substring(lastIndex, match.index);
    if (textBeforeMatch) {
      nodes.push(textBeforeMatch);
    }

    const token = match[0];
    const matchIndex = match.index;

    if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(<strong key={`strong-${matchIndex}`}>{token.substring(2, token.length - 2)}</strong>);
    } else if (token.startsWith('(link to ') || token.startsWith('(mailto:')) {
      const isMailto = token.startsWith('(mailto:');
      const content = isMailto ? token.substring(8, token.length - 1) : token.substring(10, token.length - 1);
      const href = isMailto ? `mailto:${content}` : content;
      let linkableContent: React.ReactNode = null;

      if (nodes.length > 0) {
        const lastNode = nodes[nodes.length - 1];
        if (typeof lastNode === 'string' || (React.isValidElement(lastNode) && lastNode.type === 'strong')) {
          linkableContent = nodes.pop();
        }
      }

      if (linkableContent) {
        nodes.push(
          <a 
            key={`link-${matchIndex}`}
            href={href}
            target={isMailto ? undefined : '_blank'} 
            rel={isMailto ? undefined : 'noopener noreferrer'}
            className="text-blue-500 hover:underline"
          >
            {linkableContent}
          </a>
        );
      } else {
        nodes.push(
          <a 
            key={`linkfallback-${matchIndex}`}
            href={href}
            target={isMailto ? undefined : '_blank'} 
            rel={isMailto ? undefined : 'noopener noreferrer'}
            className="text-blue-500 hover:underline"
          >
            {content} 
          </a>
        );
      }
    }
    lastIndex = tokenRegex.lastIndex;
  }

  const remainingText = line.substring(lastIndex);
  if (remainingText) {
    nodes.push(remainingText);
  }
  return nodes;
};

const parseDescription = (descriptionText: string): React.ReactNode[] => {
  const overallNodes: React.ReactNode[] = [];
  const lines = descriptionText.split(/<br\s*\/?>|\n/g);

  lines.forEach((line, index) => {
    if (line.trim() || (index < lines.length -1 && lines[index+1]?.trim())) { 
        overallNodes.push(...parseLine(line));
    }
    if (index < lines.length - 1) {
      overallNodes.push(<br key={`br-${index}`} />);
    }
  });
  
  while (overallNodes.length > 0) {
    const lastNode = overallNodes[overallNodes.length - 1];
    if (React.isValidElement(lastNode) && lastNode.type === 'br') {
      const secondLastNode = overallNodes.length > 1 ? overallNodes[overallNodes.length - 2] : null;
      const originalLineIndex = lines.length - ( (overallNodes.filter(n => React.isValidElement(n) && n.type === 'br').length) - overallNodes.indexOf(lastNode) );
      const correspondingOriginalLineIsEmpty = lines[lines.length -1 - (overallNodes.filter(n => React.isValidElement(n) && n.type === 'br').length - 1 - overallNodes.indexOf(lastNode)) ]?.trim() === '';

      if ((React.isValidElement(secondLastNode) && secondLastNode.type === 'br') || correspondingOriginalLineIsEmpty ) {
        overallNodes.pop();
      } else {
        break; 
      }
    } else {
      break; 
    }
  }
  return overallNodes;
};

const getIcon = (title: string) => {
  if (title.toLowerCase().includes('zugverbindungen')) return <IconTrain className="h-4 w-4 text-neutral-500" />;
  if (title.toLowerCase().includes('dokumentenrecherche')) return <IconFileText className="h-4 w-4 text-neutral-500" />;
  if (title.toLowerCase().includes('tagesordnung')) return <IconCalendar className="h-4 w-4 text-neutral-500" />;
  if (title.toLowerCase().includes('api')) return <IconApi className="h-4 w-4 text-neutral-500" />;
  if (title.toLowerCase().includes('person') || title.toLowerCase().includes('schulz') || title.toLowerCase().includes('hutt')) return <IconUsers className="h-4 w-4 text-neutral-500" />;
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
      header: <Skeleton />,
      icon: getIcon(title),
      className: "", // Default, will be overridden by processedItems logic below
    };
  });

  const processedItems = items.map((item, i, arr) => {
    let className = item.className;
    if (arr.length === 4) {
        if (i === 3) className = "md:col-span-3";
        else className = ""; 
    } else if (arr.length % 3 === 1 && i === arr.length - 1) {
        className = "md:col-span-3";
    } else if (arr.length % 3 === 2 && i >= arr.length -2) {
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