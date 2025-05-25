"use client";

import { PageLayout } from "@/components/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2, 
  BarChart3,
  Calendar,
  Filter,
  Download,
  Target
} from "lucide-react";
import { useState } from "react";

interface AnalyticsData {
  platform: string;
  metrics: {
    followers: number;
    engagement: number;
    reach: number;
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
  };
  growth: {
    followers: number;
    engagement: number;
    reach: number;
  };
  topPosts: {
    id: string;
    content: string;
    platform: string;
    engagement: number;
    date: string;
  }[];
}

export default function TrackingPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d");
  const [selectedPlatform, setSelectedPlatform] = useState("all");

  // Sample analytics data
  const analyticsData: AnalyticsData[] = [
    {
      platform: "Twitter",
      metrics: {
        followers: 12458,
        engagement: 2847,
        reach: 45632,
        impressions: 78923,
        likes: 1876,
        comments: 324,
        shares: 647
      },
      growth: {
        followers: 12.5,
        engagement: 8.3,
        reach: 15.2
      },
      topPosts: [
        {
          id: "1",
          content: "Neuer Beitrag über die aktuellen Entwicklungen beim Mindestlohn...",
          platform: "Twitter",
          engagement: 456,
          date: "2024-01-23"
        }
      ]
    },
    {
      platform: "Facebook",
      metrics: {
        followers: 8934,
        engagement: 1567,
        reach: 23456,
        impressions: 45678,
        likes: 1234,
        comments: 178,
        shares: 155
      },
      growth: {
        followers: 6.7,
        engagement: -2.1,
        reach: 9.8
      },
      topPosts: [
        {
          id: "2",
          content: "Unser Einsatz für bezahlbaren Wohnraum zeigt erste Erfolge...",
          platform: "Facebook",
          engagement: 289,
          date: "2024-01-22"
        }
      ]
    },
    {
      platform: "Instagram",
      metrics: {
        followers: 15723,
        engagement: 3421,
        reach: 67890,
        impressions: 123456,
        likes: 2987,
        comments: 234,
        shares: 200
      },
      growth: {
        followers: 18.3,
        engagement: 22.1,
        reach: 25.4
      },
      topPosts: [
        {
          id: "3",
          content: "Zusammen für eine nachhaltige Zukunft! Unsere neuen Vorschläge...",
          platform: "Instagram",
          engagement: 678,
          date: "2024-01-21"
        }
      ]
    }
  ];

  const totalMetrics = analyticsData.reduce((total, platform) => ({
    followers: total.followers + platform.metrics.followers,
    engagement: total.engagement + platform.metrics.engagement,
    reach: total.reach + platform.metrics.reach,
    impressions: total.impressions + platform.metrics.impressions,
    likes: total.likes + platform.metrics.likes,
    comments: total.comments + platform.metrics.comments,
    shares: total.shares + platform.metrics.shares,
  }), {
    followers: 0,
    engagement: 0,
    reach: 0,
    impressions: 0,
    likes: 0,
    comments: 0,
    shares: 0,
  });

  const averageGrowth = {
    followers: analyticsData.reduce((sum, p) => sum + p.growth.followers, 0) / analyticsData.length,
    engagement: analyticsData.reduce((sum, p) => sum + p.growth.engagement, 0) / analyticsData.length,
    reach: analyticsData.reduce((sum, p) => sum + p.growth.reach, 0) / analyticsData.length,
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return "text-green-600";
    if (growth < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4" />;
    return null;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "Twitter": return "bg-blue-500";
      case "Facebook": return "bg-blue-600";
      case "Instagram": return "bg-pink-500";
      case "LinkedIn": return "bg-blue-700";
      default: return "bg-gray-500";
    }
  };

  const filteredData = selectedPlatform === "all" 
    ? analyticsData 
    : analyticsData.filter(data => data.platform === selectedPlatform);

  return (
    <PageLayout 
      title="Social Media Tracking" 
      description="Verfolge die Performance deiner Social Media Aktivitäten und analysiere wichtige Kennzahlen."
    >
      <div className="space-y-6">
        {/* Header with Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Zeitraum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Letzte 7 Tage</SelectItem>
                <SelectItem value="30d">Letzte 30 Tage</SelectItem>
                <SelectItem value="90d">Letzte 90 Tage</SelectItem>
                <SelectItem value="1y">Letztes Jahr</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Plattform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Plattformen</SelectItem>
                <SelectItem value="Twitter">Twitter</SelectItem>
                <SelectItem value="Facebook">Facebook</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Bericht exportieren
          </Button>
        </div>

        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Follower Gesamt</p>
                  <p className="text-2xl font-bold">{formatNumber(totalMetrics.followers)}</p>
                  <div className={`flex items-center text-sm ${getGrowthColor(averageGrowth.followers)}`}>
                    {getGrowthIcon(averageGrowth.followers)}
                    <span className="ml-1">
                      {averageGrowth.followers > 0 ? '+' : ''}{averageGrowth.followers.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Engagement</p>
                  <p className="text-2xl font-bold">{formatNumber(totalMetrics.engagement)}</p>
                  <div className={`flex items-center text-sm ${getGrowthColor(averageGrowth.engagement)}`}>
                    {getGrowthIcon(averageGrowth.engagement)}
                    <span className="ml-1">
                      {averageGrowth.engagement > 0 ? '+' : ''}{averageGrowth.engagement.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Heart className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reichweite</p>
                  <p className="text-2xl font-bold">{formatNumber(totalMetrics.reach)}</p>
                  <div className={`flex items-center text-sm ${getGrowthColor(averageGrowth.reach)}`}>
                    {getGrowthIcon(averageGrowth.reach)}
                    <span className="ml-1">
                      {averageGrowth.reach > 0 ? '+' : ''}{averageGrowth.reach.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Eye className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Impressionen</p>
                  <p className="text-2xl font-bold">{formatNumber(totalMetrics.impressions)}</p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    <span>Gesamt</span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Platform Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Performance nach Plattform</CardTitle>
              <CardDescription>
                Vergleiche die Leistung deiner verschiedenen Social Media Kanäle
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredData.map((platform) => (
                <div key={platform.platform} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getPlatformColor(platform.platform)}`} />
                      <span className="font-medium">{platform.platform}</span>
                    </div>
                    <Badge variant="outline">
                      {formatNumber(platform.metrics.followers)} Follower
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Engagement</p>
                      <p className="font-semibold">{formatNumber(platform.metrics.engagement)}</p>
                      <div className={`flex items-center ${getGrowthColor(platform.growth.engagement)}`}>
                        {getGrowthIcon(platform.growth.engagement)}
                        <span className="ml-1 text-xs">
                          {platform.growth.engagement > 0 ? '+' : ''}{platform.growth.engagement.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Reichweite</p>
                      <p className="font-semibold">{formatNumber(platform.metrics.reach)}</p>
                      <div className={`flex items-center ${getGrowthColor(platform.growth.reach)}`}>
                        {getGrowthIcon(platform.growth.reach)}
                        <span className="ml-1 text-xs">
                          {platform.growth.reach > 0 ? '+' : ''}{platform.growth.reach.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Impressionen</p>
                      <p className="font-semibold">{formatNumber(platform.metrics.impressions)}</p>
                    </div>
                  </div>

                  {/* Engagement Breakdown */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3 text-red-500" />
                      <span>{formatNumber(platform.metrics.likes)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3 text-blue-500" />
                      <span>{formatNumber(platform.metrics.comments)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Share2 className="h-3 w-3 text-green-500" />
                      <span>{formatNumber(platform.metrics.shares)}</span>
                    </div>
                  </div>

                  <hr className="last:hidden" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top Performing Content */}
          <Card>
            <CardHeader>
              <CardTitle>Top performende Inhalte</CardTitle>
              <CardDescription>
                Deine erfolgreichsten Beiträge der letzten Zeit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredData
                .flatMap(platform => platform.topPosts)
                .sort((a, b) => b.engagement - a.engagement)
                .slice(0, 5)
                .map((post) => (
                  <div key={post.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className={`w-3 h-3 rounded-full mt-2 ${getPlatformColor(post.platform)}`} />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm line-clamp-2">{post.content}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{post.platform}</span>
                        <span>{new Date(post.date).toLocaleDateString("de-DE")}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{post.engagement}</p>
                      <p className="text-xs text-muted-foreground">Interactions</p>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>

        {/* Engagement Rate Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement-Rate Analyse</CardTitle>
            <CardDescription>
              Verstehe, wie gut deine Inhalte bei deiner Zielgruppe ankommen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredData.map((platform) => {
                const engagementRate = (platform.metrics.engagement / platform.metrics.reach * 100);
                return (
                  <div key={platform.platform} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getPlatformColor(platform.platform)}`} />
                        <span className="font-medium">{platform.platform}</span>
                      </div>
                      <span className="text-sm font-semibold">{engagementRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={engagementRate} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {engagementRate > 5 ? "Überdurchschnittlich" : 
                       engagementRate > 2 ? "Durchschnittlich" : "Verbesserungsbedarf"}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Goals and KPIs */}
        <Card>
          <CardHeader>
            <CardTitle>Ziele & KPIs</CardTitle>
            <CardDescription>
              Verfolge deine monatlichen Social Media Ziele
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Neue Follower</span>
                  <span className="text-sm font-semibold">78%</span>
                </div>
                <Progress value={78} className="h-2" />
                <p className="text-xs text-muted-foreground">1.560 / 2.000 Ziel</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Engagement-Rate</span>
                  <span className="text-sm font-semibold">92%</span>
                </div>
                <Progress value={92} className="h-2" />
                <p className="text-xs text-muted-foreground">4.6% / 5.0% Ziel</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Reichweite</span>
                  <span className="text-sm font-semibold">65%</span>
                </div>
                <Progress value={65} className="h-2" />
                <p className="text-xs text-muted-foreground">136K / 200K Ziel</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Content-Frequenz</span>
                  <span className="text-sm font-semibold">84%</span>
                </div>
                <Progress value={84} className="h-2" />
                <p className="text-xs text-muted-foreground">21 / 25 Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
} 