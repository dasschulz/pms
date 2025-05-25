"use client";

import { PageLayout } from "@/components/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Filter, Search, Edit3, Trash2, Clock, Users, Hash } from "lucide-react";
import { useState } from "react";

interface ContentPlan {
  id: string;
  title: string;
  content: string;
  platform: string;
  scheduledDate: string;
  status: "draft" | "scheduled" | "published";
  tags: string[];
  engagement?: number;
}

export default function RedaktionsplanPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Sample data - in real app this would come from API
  const [contentPlans] = useState<ContentPlan[]>([
    {
      id: "1",
      title: "Mindestlohn-Kampagne",
      content: "Neuer Beitrag über die aktuellen Entwicklungen beim Mindestlohn. #Mindestlohn #SozialeGerechtigkeit",
      platform: "Twitter",
      scheduledDate: "2024-01-25T10:00:00",
      status: "scheduled",
      tags: ["Mindestlohn", "Politik", "Soziales"],
      engagement: 145
    },
    {
      id: "2", 
      title: "Wohnungspolitik Update",
      content: "Unser Einsatz für bezahlbaren Wohnraum zeigt erste Erfolge. Mehr Details in unserem neuen Blogpost.",
      platform: "Facebook",
      scheduledDate: "2024-01-26T14:30:00",
      status: "draft",
      tags: ["Wohnen", "Politik"],
    },
    {
      id: "3",
      title: "Klimaschutz-Initiative",
      content: "Zusammen für eine nachhaltige Zukunft! Unsere neuen Vorschläge zum Klimaschutz.",
      platform: "Instagram",
      scheduledDate: "2024-01-24T18:00:00",
      status: "published",
      tags: ["Klima", "Umwelt", "Zukunft"],
      engagement: 289
    }
  ]);

  const filteredPlans = contentPlans.filter(plan => {
    const matchesSearch = plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = selectedPlatform === "all" || plan.platform === selectedPlatform;
    const matchesStatus = selectedStatus === "all" || plan.status === selectedStatus;
    
    return matchesSearch && matchesPlatform && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-green-100 text-green-800 border-green-200";
      case "scheduled": return "bg-blue-100 text-blue-800 border-blue-200";
      case "draft": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published": return "✓";
      case "scheduled": return "⏰";
      case "draft": return "📝";
      default: return "📝";
    }
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

  return (
    <PageLayout 
      title="Redaktionsplan" 
      description="Plane und verwalte deine Social Media Inhalte strategisch und effizient."
    >
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suche nach Inhalten..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Plattform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Plattformen</SelectItem>
                  <SelectItem value="Twitter">Twitter</SelectItem>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="draft">Entwurf</SelectItem>
                  <SelectItem value="scheduled">Geplant</SelectItem>
                  <SelectItem value="published">Veröffentlicht</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Neuer Inhalt
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Entwürfe</p>
                  <p className="text-2xl font-bold">{contentPlans.filter(p => p.status === "draft").length}</p>
                </div>
                <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                  📝
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Geplant</p>
                  <p className="text-2xl font-bold">{contentPlans.filter(p => p.status === "scheduled").length}</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  ⏰
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Veröffentlicht</p>
                  <p className="text-2xl font-bold">{contentPlans.filter(p => p.status === "published").length}</p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  ✓
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gesamt Engagement</p>
                  <p className="text-2xl font-bold">
                    {contentPlans.reduce((sum, plan) => sum + (plan.engagement || 0), 0)}
                  </p>
                </div>
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Geplante Inhalte ({filteredPlans.length})</h3>
          
          {filteredPlans.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Keine Inhalte gefunden.</p>
                <Button onClick={() => setShowCreateForm(true)} className="mt-4">
                  Ersten Inhalt erstellen
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredPlans.map((plan) => (
                <Card key={plan.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-lg">{plan.title}</h4>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getPlatformColor(plan.platform)}`} />
                            <span className="text-sm text-muted-foreground">{plan.platform}</span>
                          </div>
                        </div>
                        
                        <p className="text-muted-foreground line-clamp-2">{plan.content}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(plan.scheduledDate).toLocaleDateString("de-DE", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </div>
                          
                          {plan.engagement && (
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {plan.engagement} Interaktionen
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(plan.status)}>
                            {getStatusIcon(plan.status)} {plan.status === "draft" ? "Entwurf" : plan.status === "scheduled" ? "Geplant" : "Veröffentlicht"}
                          </Badge>
                          
                          {plan.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              <Hash className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="ghost" size="sm">
                          <Edit3 className="h-4 w-4" />
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
          )}
        </div>

        {/* Create Form Modal (simplified for now) */}
        {showCreateForm && (
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
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Abbrechen
                </Button>
                <Button onClick={() => setShowCreateForm(false)}>
                  Als Entwurf speichern
                </Button>
                <Button onClick={() => setShowCreateForm(false)}>
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