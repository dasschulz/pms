import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Calendar, TrendingUp, Image } from 'lucide-react';

const socialMediaFeatures = [
  {
    title: 'Skriptgenerator',
    description: 'Erstellen Sie ansprechende Skripte für Videos und Social Media Content',
    href: '/skriptgenerator',
    icon: Video,
    color: 'bg-pink-500',
  },
  {
    title: 'Redaktionsplan',
    description: 'Planen und organisieren Sie Ihre Social Media Posts strategisch',
    href: '/redaktionsplan',
    icon: Calendar,
    color: 'bg-yellow-500',
  },
  {
    title: 'Tracking',
    description: 'Verfolgen Sie die Performance Ihrer Social Media Aktivitäten',
    href: '/tracking',
    icon: TrendingUp,
    color: 'bg-green-500',
  },
  {
    title: 'Sharepics',
    description: 'Erstellen Sie professionelle Grafiken für Social Media Posts',
    href: '/sharepics',
    icon: Image,
    color: 'bg-violet-500',
  },
];

export default function SocialMediaPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Social Media</h1>
        <p className="text-muted-foreground text-lg">
          Alle Tools für professionelles Social Media Management und Content-Erstellung
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {socialMediaFeatures.map((feature, index) => (
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