import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSearch2, FileText, FolderOpen, HelpCircle } from 'lucide-react';

const fragenwesenFeatures = [
  {
    title: 'Anfrage erstellen',
    description: 'Erstellen Sie neue parlamentarische Anfragen mit KI-Unterstützung',
    href: '/kleine-anfragen/generate',
    icon: FileSearch2,
    color: 'bg-blue-500',
  },
  {
    title: 'Anfrage analysieren',
    description: 'Analysieren Sie bestehende Anfragen und Antworten',
    href: '/kleine-anfragen/analyze',
    icon: FileText,
    color: 'bg-green-500',
  },
  {
    title: 'Meine Anfragen',
    description: 'Verwalten und überprüfen Sie alle Ihre eingereichten Anfragen',
    href: '/kleine-anfragen',
    icon: FolderOpen,
    color: 'bg-purple-500',
  },
  {
    title: 'Schriftliche Fragen',
    description: 'Erstellen und verwalten Sie schriftliche Fragen an die Regierung',
    href: '/schriftliche-fragen',
    icon: HelpCircle,
    color: 'bg-orange-500',
  },
];

export default function FragewesenPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Fragewesen</h1>
        <p className="text-muted-foreground text-lg">
          Alle Tools für parlamentarische Anfragen und schriftliche Fragen an einem Ort
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {fragenwesenFeatures.map((feature, index) => (
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