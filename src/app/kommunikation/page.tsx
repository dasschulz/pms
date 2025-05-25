import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Mail } from 'lucide-react';

const kommunikationFeatures = [
  {
    title: 'PM-Generator',
    description: 'Erstellen Sie professionelle Pressemitteilungen mit KI-Unterstützung',
    href: '/pressemitteilung',
    icon: FileText,
    color: 'bg-emerald-500',
  },
  {
    title: 'Bürgerpost',
    description: 'Verwalten und beantworten Sie Anfragen von Bürgern effizient',
    href: '/buergerpost',
    icon: Mail,
    color: 'bg-cyan-500',
  },
];

export default function KommunikationPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Kommunikation</h1>
        <p className="text-muted-foreground text-lg">
          Alle Tools für professionelle Kommunikation und Öffentlichkeitsarbeit
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {kommunikationFeatures.map((feature, index) => (
          <Link key={index} href={feature.href} className="block group">
            <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${feature.color} text-white`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                      {feature.title}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
} 