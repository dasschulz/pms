"use client";

import { PageLayout } from "@/components/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Image, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit3, 
  Copy, 
  Trash2,
  Palette,
  Type,
  Layout,
  Sparkles,
  Share2,
  Heart,
  MessageCircle,
  Eye,
  BarChart3,
  Calendar
} from "lucide-react";
import { useState } from "react";

interface SharepicTemplate {
  id: string;
  title: string;
  category: string;
  platform: string;
  dimensions: string;
  thumbnail: string;
  isPopular?: boolean;
  usageCount?: number;
  lastUsed?: string;
}

interface CreatedSharepic {
  id: string;
  title: string;
  template: string;
  platform: string;
  createdAt: string;
  status: "draft" | "published";
  engagement?: {
    likes: number;
    shares: number;
    views: number;
  };
}

export default function SharepicsPage() {
  const [activeTab, setActiveTab] = useState("templates");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Sample template data
  const templates: SharepicTemplate[] = [
    {
      id: "1",
      title: "Politik Zitat",
      category: "Zitate",
      platform: "Instagram",
      dimensions: "1080x1080",
      thumbnail: "/api/placeholder/300/300",
      isPopular: true,
      usageCount: 45,
      lastUsed: "2024-01-23"
    },
    {
      id: "2", 
      title: "Statistik Infografik",
      category: "Infografiken",
      platform: "Twitter",
      dimensions: "1200x675",
      thumbnail: "/api/placeholder/300/200",
      usageCount: 32,
      lastUsed: "2024-01-22"
    },
    {
      id: "3",
      title: "Event Ankündigung",
      category: "Events",
      platform: "Facebook",
      dimensions: "1200x630",
      thumbnail: "/api/placeholder/300/200",
      isPopular: true,
      usageCount: 28,
      lastUsed: "2024-01-21"
    },
    {
      id: "4",
      title: "Kampagnen Banner",
      category: "Kampagnen",
      platform: "Instagram",
      dimensions: "1080x1080",
      thumbnail: "/api/placeholder/300/300",
      usageCount: 19,
      lastUsed: "2024-01-20"
    },
    {
      id: "5",
      title: "News Update",
      category: "News",
      platform: "LinkedIn",
      dimensions: "1200x627",
      thumbnail: "/api/placeholder/300/200",
      usageCount: 15,
      lastUsed: "2024-01-19"
    },
    {
      id: "6",
      title: "Minimalist Quote",
      category: "Zitate",
      platform: "Instagram",
      dimensions: "1080x1350",
      thumbnail: "/api/placeholder/300/350",
      isPopular: true,
      usageCount: 67,
      lastUsed: "2024-01-18"
    }
  ];

  // Sample created sharepics
  const createdSharepics: CreatedSharepic[] = [
    {
      id: "1",
      title: "Mindestlohn erhöhen - Jetzt!",
      template: "Politik Zitat",
      platform: "Instagram",
      createdAt: "2024-01-23",
      status: "published",
      engagement: {
        likes: 234,
        shares: 45,
        views: 2847
      }
    },
    {
      id: "2",
      title: "Wohnungsstatistik 2024",
      template: "Statistik Infografik", 
      platform: "Twitter",
      createdAt: "2024-01-22",
      status: "published",
      engagement: {
        likes: 156,
        shares: 78,
        views: 1923
      }
    },
    {
      id: "3",
      title: "Bürgerdialog zur Klimapolitik",
      template: "Event Ankündigung",
      platform: "Facebook",
      createdAt: "2024-01-21",
      status: "draft"
    }
  ];

  const categories = ["Zitate", "Infografiken", "Events", "Kampagnen", "News"];
  const platforms = ["Instagram", "Twitter", "Facebook", "LinkedIn"];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    const matchesPlatform = selectedPlatform === "all" || template.platform === selectedPlatform;
    return matchesSearch && matchesCategory && matchesPlatform;
  });

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "Twitter": return "bg-blue-500";
      case "Facebook": return "bg-blue-600";
      case "Instagram": return "bg-pink-500";
      case "LinkedIn": return "bg-blue-700";
      default: return "bg-gray-500";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Zitate": return "bg-purple-100 text-purple-800";
      case "Infografiken": return "bg-blue-100 text-blue-800";
      case "Events": return "bg-green-100 text-green-800";
      case "Kampagnen": return "bg-red-100 text-red-800";
      case "News": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <PageLayout 
      title="Sharepics" 
      description="Erstelle professionelle Social Media Graphics mit anpassbaren Vorlagen."
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <TabsList className="grid w-full grid-cols-3 sm:w-auto">
              <TabsTrigger value="templates">Vorlagen</TabsTrigger>
              <TabsTrigger value="created">Meine Bilder</TabsTrigger>
              <TabsTrigger value="create">Erstellen</TabsTrigger>
            </TabsList>

            {activeTab === "templates" && (
              <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Neues Sharepic
              </Button>
            )}
          </div>

          <TabsContent value="templates" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Suche nach Vorlagen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Kategorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Kategorien</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Plattform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Plattformen</SelectItem>
                    {platforms.map(platform => (
                      <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Popular Templates Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Beliebte Vorlagen
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTemplates
                  .filter(template => template.isPopular)
                  .map((template) => (
                    <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                      <CardContent className="p-4">
                        <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden">
                          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                            <Image className="h-12 w-12 text-muted-foreground" />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm line-clamp-1">{template.title}</h4>
                            <Badge className="text-xs">Beliebt</Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className={`w-2 h-2 rounded-full ${getPlatformColor(template.platform)}`} />
                            <span>{template.platform}</span>
                            <span>•</span>
                            <span>{template.dimensions}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className={getCategoryColor(template.category)}>
                              {template.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {template.usageCount}x verwendet
                            </span>
                          </div>
                          
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="sm" variant="outline" className="flex-1">
                              <Edit3 className="h-3 w-3 mr-1" />
                              Bearbeiten
                            </Button>
                            <Button size="sm" variant="outline">
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>

            {/* All Templates */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Alle Vorlagen ({filteredTemplates.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTemplates
                  .filter(template => !template.isPopular)
                  .map((template) => (
                    <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                      <CardContent className="p-4">
                        <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden">
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <Image className="h-12 w-12 text-muted-foreground" />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm line-clamp-1">{template.title}</h4>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className={`w-2 h-2 rounded-full ${getPlatformColor(template.platform)}`} />
                            <span>{template.platform}</span>
                            <span>•</span>
                            <span>{template.dimensions}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className={getCategoryColor(template.category)}>
                              {template.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {template.usageCount}x verwendet
                            </span>
                          </div>
                          
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="sm" variant="outline" className="flex-1">
                              <Edit3 className="h-3 w-3 mr-1" />
                              Bearbeiten
                            </Button>
                            <Button size="sm" variant="outline">
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="created" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <h3 className="text-lg font-semibold">Meine Sharepics ({createdSharepics.length})</h3>
              <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Neues Sharepic
              </Button>
            </div>

            <div className="grid gap-4">
              {createdSharepics.map((sharepic) => (
                <Card key={sharepic.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                        <Image className="h-8 w-8 text-muted-foreground" />
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-lg">{sharepic.title}</h4>
                          <div className="flex items-center gap-2">
                            <Badge 
                              className={sharepic.status === "published" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                            >
                              {sharepic.status === "published" ? "Veröffentlicht" : "Entwurf"}
                            </Badge>
                            <div className={`w-3 h-3 rounded-full ${getPlatformColor(sharepic.platform)}`} />
                            <span className="text-sm text-muted-foreground">{sharepic.platform}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Vorlage: {sharepic.template}</span>
                          <span>•</span>
                          <span>Erstellt: {new Date(sharepic.createdAt).toLocaleDateString("de-DE")}</span>
                        </div>

                        {sharepic.engagement && (
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4 text-blue-500" />
                              <span>{sharepic.engagement.views.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="h-4 w-4 text-red-500" />
                              <span>{sharepic.engagement.likes}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Share2 className="h-4 w-4 text-green-500" />
                              <span>{sharepic.engagement.shares}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Neues Sharepic erstellen</CardTitle>
                <CardDescription>
                  Wähle eine Vorlage oder starte mit einem leeren Design
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quick Start Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 border-dashed border-muted-foreground/25 hover:border-primary">
                    <CardContent className="p-6 text-center">
                      <Layout className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h4 className="font-semibold mb-2">Leeres Design</h4>
                      <p className="text-sm text-muted-foreground">Starte von Grund auf</p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-6 text-center">
                      <Type className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                      <h4 className="font-semibold mb-2">Text-Zitat</h4>
                      <p className="text-sm text-muted-foreground">Für wichtige Aussagen</p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-6 text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <h4 className="font-semibold mb-2">Infografik</h4>
                      <p className="text-sm text-muted-foreground">Daten visualisieren</p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-6 text-center">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-purple-500" />
                      <h4 className="font-semibold mb-2">Event</h4>
                      <p className="text-sm text-muted-foreground">Veranstaltungen bewerben</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Custom Creator Form */}
                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold mb-4">Oder anpassen</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Titel</Label>
                        <Input id="title" placeholder="Titel für dein Sharepic" />
                      </div>
                      
                      <div>
                        <Label htmlFor="platform">Ziel-Plattform</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Wähle Plattform" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="instagram-square">Instagram (1080x1080)</SelectItem>
                            <SelectItem value="instagram-story">Instagram Story (1080x1920)</SelectItem>
                            <SelectItem value="twitter">Twitter (1200x675)</SelectItem>
                            <SelectItem value="facebook">Facebook (1200x630)</SelectItem>
                            <SelectItem value="linkedin">LinkedIn (1200x627)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="category">Kategorie</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Wähle Kategorie" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(category => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="text">Haupttext</Label>
                        <Textarea 
                          id="text" 
                          placeholder="Gib den Text für dein Sharepic ein..."
                          className="min-h-[100px]"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="colors">Farbschema</Label>
                        <div className="flex gap-2 mt-2">
                          <div className="w-8 h-8 bg-red-500 rounded cursor-pointer border-2 border-transparent hover:border-gray-300" />
                          <div className="w-8 h-8 bg-blue-500 rounded cursor-pointer border-2 border-transparent hover:border-gray-300" />
                          <div className="w-8 h-8 bg-green-500 rounded cursor-pointer border-2 border-transparent hover:border-gray-300" />
                          <div className="w-8 h-8 bg-purple-500 rounded cursor-pointer border-2 border-transparent hover:border-gray-300" />
                          <div className="w-8 h-8 bg-orange-500 rounded cursor-pointer border-2 border-transparent hover:border-gray-300" />
                          <Button variant="outline" size="sm" className="ml-2">
                            <Palette className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline">Vorschau</Button>
                    <Button>Erstellen</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Form Modal (simplified for now) */}
        {showCreateModal && (
          <Card className="fixed inset-4 z-50 bg-background shadow-2xl">
            <CardHeader>
              <CardTitle>Neuen Inhalt erstellen</CardTitle>
              <CardDescription>
                Plane einen neuen Social Media Beitrag für deine Kampagne.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titel</Label>
                <Input id="title" placeholder="Beschreibender Titel für den Beitrag" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Inhalt</Label>
                <Textarea 
                  id="content" 
                  placeholder="Verfasse deinen Social Media Beitrag..."
                  className="min-h-[120px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="platform">Plattform</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Wähle Plattform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Twitter">Twitter</SelectItem>
                      <SelectItem value="Facebook">Facebook</SelectItem>
                      <SelectItem value="Instagram">Instagram</SelectItem>
                      <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schedule">Zeitplan</Label>
                  <Input type="datetime-local" id="schedule" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (durch Komma getrennt)</Label>
                <Input id="tags" placeholder="Politik, Soziales, Kampagne" />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Abbrechen
                </Button>
                <Button onClick={() => setShowCreateModal(false)}>
                  Als Entwurf speichern
                </Button>
                <Button onClick={() => setShowCreateModal(false)}>
                  Planen
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
} 