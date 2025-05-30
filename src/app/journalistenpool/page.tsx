'use client';

import { useState, useEffect } from 'react';
import { redirect } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Search, Phone, Mail, Building, Edit2, Trash2, Star, MessageCircle, StarIcon, TrendingUp, User, Award } from 'lucide-react';
import { JournalistModal } from '@/components/journalistenpool/journalist-modal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';

interface Journalist {
  id: string;
  titel: string;
  vorname: string;
  nachname: string;
  haus: string;
  funktion: string;
  email: string;
  telefon: string;
  medium: string;
  ressort: string;
  zustaendig_fuer: string;
  land: string;
  region: string;
  schwerpunkt: string;
  themen: string[];
  zustimmung_datenspeicherung: boolean;
  angelegt_von: string;
  hinzugefuegt_von: string;
  created_at: string;
  avg_zuverlaessigkeit: number;
  avg_gewogenheit_linke: number;
  avg_nimmt_texte_an: number;
  avg_freundlichkeit: number;
  rating_count: number;
  region_display: string;
}

export default function JournalistenpoolPage() {
  const { data: session, status } = useSession();
  const [journalists, setJournalists] = useState<Journalist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMedium, setSelectedMedium] = useState('all');
  const [selectedRessort, setSelectedRessort] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJournalist, setSelectedJournalist] = useState<Journalist | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [journalistToDelete, setJournalistToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailJournalist, setDetailJournalist] = useState<Journalist | null>(null);
  const [journalistComments, setJournalistComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  
  // Rating modal state
  const [ratingData, setRatingData] = useState({
    zuverlaessigkeit: 1,
    gewogenheit_linke: 1,
    nimmt_texte_an: 1,
    freundlichkeit: 1
  });
  
  // Comment modal state
  const [commentText, setCommentText] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  if (status === 'loading') {
    return (
      <PageLayout title="Journalist:innen-Pool">
        <div className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </PageLayout>
    );
  }

  if (!session) {
    redirect('/anmelden');
  }

  useEffect(() => {
    fetchJournalists();
  }, []);

  const fetchJournalists = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/journalistenpool');
      if (response.ok) {
        const data = await response.json();
        setJournalists(data);
      }
    } catch (error) {
      console.error('Error fetching journalists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateJournalist = () => {
    setSelectedJournalist(null);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEditJournalist = (journalist: Journalist) => {
    setSelectedJournalist(journalist);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDeleteJournalist = async (id: string) => {
    try {
      const response = await fetch(`/api/journalistenpool/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchJournalists();
      }
    } catch (error) {
      console.error('Error deleting journalist:', error);
    }
  };

  const handleModalSave = async () => {
    setIsModalOpen(false);
    await fetchJournalists();
  };

  const handleRateJournalist = (journalist: Journalist) => {
    setSelectedJournalist(journalist);
    setRatingData({
      zuverlaessigkeit: 1,
      gewogenheit_linke: 1,
      nimmt_texte_an: 1,
      freundlichkeit: 1
    });
    setIsRatingModalOpen(true);
  };

  const handleCommentJournalist = (journalist: Journalist) => {
    setSelectedJournalist(journalist);
    setCommentText('');
    setIsCommentModalOpen(true);
  };

  const handleSubmitRating = async () => {
    if (!selectedJournalist) return;
    
    setIsSubmittingRating(true);
    try {
      const response = await fetch('/api/journalistenpool/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          journalist_id: selectedJournalist.id,
          ...ratingData
        }),
      });

      if (response.ok) {
        setIsRatingModalOpen(false);
        await fetchJournalists(); // Reload to get updated ratings
      } else {
        const errorData = await response.json();
        alert(`Fehler beim Speichern der Bewertung: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Fehler beim Speichern der Bewertung');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!selectedJournalist || !commentText.trim()) return;
    
    setIsSubmittingComment(true);
    try {
      const response = await fetch('/api/journalistenpool/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          journalist_id: selectedJournalist.id,
          comment: commentText.trim()
        }),
      });

      if (response.ok) {
        setIsCommentModalOpen(false);
        setCommentText('');
        // Optionally reload or show success message
      } else {
        const errorData = await response.json();
        alert(`Fehler beim Speichern des Kommentars: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Fehler beim Speichern des Kommentars');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleJournalistClick = async (journalist: Journalist) => {
    setDetailJournalist(journalist);
    setIsDetailModalOpen(true);
    
    // Load comments for this journalist
    setIsLoadingComments(true);
    try {
      const response = await fetch(`/api/journalistenpool/comments?journalist_id=${journalist.id}`);
      if (response.ok) {
        const comments = await response.json();
        setJournalistComments(comments);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-2 shadow-lg">
          <p className="text-sm font-medium">{label}: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  const filteredJournalists = journalists.filter(journalist => {
    const matchesSearch = searchTerm === '' || 
      journalist.vorname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      journalist.nachname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      journalist.haus.toLowerCase().includes(searchTerm.toLowerCase()) ||
      journalist.medium.toLowerCase().includes(searchTerm.toLowerCase()) ||
      journalist.ressort.toLowerCase().includes(searchTerm.toLowerCase()) ||
      journalist.themen.some(thema => thema.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMedium = selectedMedium === 'all' || journalist.medium === selectedMedium;
    const matchesRessort = selectedRessort === 'all' || journalist.ressort === selectedRessort;

    return matchesSearch && matchesMedium && matchesRessort;
  });

  const medien = Array.from(new Set(journalists.map(j => j.medium)));
  const ressorts = Array.from(new Set(journalists.map(j => j.ressort)));

  const stats = {
    gesamt: journalists.length,
    presse: journalists.filter(j => j.medium === 'Presse').length,
    radio: journalists.filter(j => j.medium === 'Radio').length,
    fernsehen: journalists.filter(j => j.medium === 'Fernsehen').length,
  };

  const renderStars = (rating: number, isDark: boolean) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star 
            key={i} 
            className={`w-3 h-3 ${isDark ? 'text-white' : 'text-red-500'} fill-current`} 
          />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative w-3 h-3">
            <Star className={`absolute w-3 h-3 ${isDark ? 'text-gray-500' : 'text-gray-300'}`} />
            <div className="absolute overflow-hidden w-1.5">
              <Star className={`w-3 h-3 ${isDark ? 'text-white' : 'text-red-500'} fill-current`} />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star 
            key={i} 
            className={`w-3 h-3 ${isDark ? 'text-gray-500' : 'text-gray-300'}`} 
          />
        );
      }
    }
    return stars;
  };

  const renderRatingStars = (rating: number, onChange: (rating: number) => void) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className={`w-6 h-6 ${i <= rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
        >
          <StarIcon className="w-full h-full fill-current" />
        </button>
      );
    }
    return stars;
  };

  const getMediumChartData = () => {
    const mediumCounts = journalists.reduce((acc, journalist) => {
      acc[journalist.medium] = (acc[journalist.medium] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mediumOptions = ['Presse', 'Radio', 'Fernsehen', 'Podcast', 'Video', 'Social Media'];
    
    return mediumOptions.map(medium => ({
      medium,
      count: mediumCounts[medium] || 0
    }));
  };

  const getBestRatedJournalists = () => {
    return journalists
      .filter(j => j.rating_count > 0)
      .sort((a, b) => {
        const aRating = (a.avg_zuverlaessigkeit + a.avg_gewogenheit_linke + a.avg_nimmt_texte_an + a.avg_freundlichkeit) / 4;
        const bRating = (b.avg_zuverlaessigkeit + b.avg_gewogenheit_linke + b.avg_nimmt_texte_an + b.avg_freundlichkeit) / 4;
        return bRating - aRating;
      })
      .slice(0, 5);
  };

  return (
    <PageLayout
      title="Journalist:innen-Pool"
      description="Verwalte deine Kontakte zu Journalist:innen aus verschiedenen Medien und Ressorts. Organisiere Pressekontakte, bewerte Zuverlässigkeit und verfolge erfolgreiche Kooperationen."
      headerActions={
        <Button onClick={handleCreateJournalist} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Neue:n Journalist:in hinzufügen
        </Button>
      }
    >
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gesamt</p>
                <p className="text-2xl font-bold">{stats.gesamt}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Print/Online</p>
                <p className="text-2xl font-bold">{stats.presse}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Search className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Radio</p>
                <p className="text-2xl font-bold">{stats.radio}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <Building className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">TV</p>
                <p className="text-2xl font-bold">{stats.fernsehen}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                <Phone className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Nach Namen, Medium, Ressort oder Themen suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedMedium} onValueChange={setSelectedMedium}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Medien" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Medien</SelectItem>
                  {medien.map(medium => (
                    <SelectItem key={medium} value={medium}>
                      {medium}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedRessort} onValueChange={setSelectedRessort}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Ressorts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Ressorts</SelectItem>
                  {ressorts.map(ressort => (
                    <SelectItem key={ressort} value={ressort}>
                      {ressort}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Journalists List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Journalist:innen ({filteredJournalists.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : filteredJournalists.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Keine Journalist:innen gefunden
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || selectedMedium || selectedRessort
                  ? 'Versuche andere Suchkriterien oder füge eine:n neue:n Journalist:in hinzu.'
                  : 'Füge deine:n erste:n Journalist:in hinzu, um loszulegen.'
                }
              </p>
              <Button onClick={handleCreateJournalist}>
                <Plus className="h-4 w-4 mr-2" />
                Neue:n Journalist:in hinzufügen
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredJournalists.map((journalist) => {
                const isDark = document.documentElement.classList.contains('dark');
                const overallRating = journalist.rating_count > 0 
                  ? (journalist.avg_zuverlaessigkeit + journalist.avg_gewogenheit_linke + 
                     journalist.avg_nimmt_texte_an + journalist.avg_freundlichkeit) / 4 
                  : 0;

                return (
                  <Card
                    key={journalist.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleJournalistClick(journalist)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-base line-clamp-2">
                          {journalist.titel && `${journalist.titel} `}
                          {journalist.vorname} {journalist.nachname}
                        </h3>
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRateJournalist(journalist);
                            }}
                            className="h-8 w-8 p-0"
                            title="Bewerten"
                          >
                            <Star className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCommentJournalist(journalist);
                            }}
                            className="h-8 w-8 p-0"
                            title="Kommentieren"
                          >
                            <MessageCircle className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditJournalist(journalist);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setJournalistToDelete({ 
                                id: journalist.id, 
                                name: `${journalist.titel ? journalist.titel + ' ' : ''}${journalist.vorname} ${journalist.nachname}` 
                              });
                              setIsDeleteModalOpen(true);
                            }}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="text-xs text-muted-foreground">
                          <p className="line-clamp-1 font-medium">{journalist.haus}</p>
                          {journalist.funktion && <p className="line-clamp-1">{journalist.funktion}</p>}
                        </div>

                        <div className="flex flex-wrap gap-1">
                          <Badge variant="default" className="text-xs">
                            {journalist.medium}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {journalist.ressort}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {journalist.region_display}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {journalist.themen.slice(0, 2).map(thema => (
                            <Badge key={thema} variant="secondary" className="text-xs">
                              {thema}
                            </Badge>
                          ))}
                          {journalist.themen.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{journalist.themen.length - 2}
                            </Badge>
                          )}
                        </div>

                        {/* Rating Display */}
                        {journalist.rating_count > 0 && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-0.5">
                                {renderStars(overallRating, isDark)}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                ({journalist.rating_count} Bewertung{journalist.rating_count !== 1 ? 'en' : ''})
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-1">
                          {journalist.email && (
                            <div className="flex items-center gap-1 text-xs">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <a 
                                href={`mailto:${journalist.email}`} 
                                className="hover:underline text-muted-foreground line-clamp-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {journalist.email}
                              </a>
                            </div>
                          )}
                          {journalist.telefon && (
                            <div className="flex items-center gap-1 text-xs">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <a 
                                href={`tel:${journalist.telefon}`} 
                                className="hover:underline text-muted-foreground"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {journalist.telefon}
                              </a>
                            </div>
                          )}
                        </div>
                        
                        {journalist.hinzugefuegt_von && (
                          <div className="text-xs text-muted-foreground">
                            Hinzugefügt von: {journalist.hinzugefuegt_von}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Radar Chart - Medium Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Medien-Verteilung
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-0 -mt-2">
            <div className="mx-auto aspect-square max-h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={getMediumChartData()} margin={{ top: 0, right: 60, bottom: 30, left: 60 }}>
                  <PolarAngleAxis dataKey="medium" tick={{ fontSize: 11 }} />
                  <PolarGrid />
                  <Tooltip content={<CustomTooltip />} />
                  <Radar
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                    dot={{
                      r: 4,
                      fill: "hsl(var(--primary))",
                      fillOpacity: 1,
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Best Rated Journalists */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Beste Bewertungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getBestRatedJournalists().length === 0 ? (
              <div className="text-center py-8">
                <Award className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Noch keine Bewertungen vorhanden
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {getBestRatedJournalists().map((journalist, index) => {
                  const isDark = document.documentElement.classList.contains('dark');
                  const overallRating = (journalist.avg_zuverlaessigkeit + journalist.avg_gewogenheit_linke + 
                                       journalist.avg_nimmt_texte_an + journalist.avg_freundlichkeit) / 4;
                  
                  return (
                    <div key={journalist.id}>
                      <div 
                        className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded p-2 -m-2"
                        onClick={() => handleJournalistClick(journalist)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {journalist.titel && `${journalist.titel} `}
                            {journalist.vorname} {journalist.nachname}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {journalist.haus} • {journalist.medium}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <div className="flex items-center gap-0.5">
                            {renderStars(overallRating, isDark)}
                          </div>
                          <span className="text-xs text-muted-foreground ml-1">
                            {overallRating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      {index < getBestRatedJournalists().length - 1 && (
                        <div className="border-t mt-3 pt-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Direct Help Contact */}
        <Card className="overflow-hidden">
          <CardHeader className="p-0 relative h-32 sm:h-40">
            <Avatar className="w-full h-full rounded-t-lg rounded-b-none">
              <AvatarImage src="/api/placeholder/300/160" alt="Benjamin Wuttke" className="object-cover w-full h-full"/>
              <AvatarFallback className="w-full h-full rounded-t-lg rounded-b-none flex items-center justify-center text-4xl">
                BW
              </AvatarFallback>
            </Avatar>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="text-left">
                <h3 className="font-medium">Benjamin Wuttke</h3>
                <p className="text-sm text-muted-foreground">Pressesprecher</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href="tel:+493022751304" 
                    className="hover:underline"
                  >
                    (030) 22751304
                  </a>
                  <span className="text-xs text-muted-foreground">(Büro)</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href="mailto:benjamin.wuttke@dielinkebt.de" 
                    className="hover:underline break-all"
                  >
                    benjamin.wuttke@dielinkebt.de
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <JournalistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleModalSave}
        journalist={selectedJournalist}
        isEditing={isEditing}
      />

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Journalist:in löschen</DialogTitle>
            <DialogDescription>
              Bist du sicher, dass du <strong>{journalistToDelete?.name}</strong> löschen möchtest? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (journalistToDelete) {
                  handleDeleteJournalist(journalistToDelete.id);
                  setIsDeleteModalOpen(false);
                  setJournalistToDelete(null);
                }
              }}
            >
              Löschen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isRatingModalOpen} onOpenChange={setIsRatingModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Bewertung abgeben</DialogTitle>
            <DialogDescription>
              Bewerte {selectedJournalist?.vorname} {selectedJournalist?.nachname} in den verschiedenen Kategorien.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="zuverlaessigkeit">Zuverlässigkeit</Label>
              <div className="flex items-center gap-1 mt-1">
                {renderRatingStars(ratingData.zuverlaessigkeit, (rating) => 
                  setRatingData(prev => ({ ...prev, zuverlaessigkeit: rating }))
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="gewogenheit_linke">Gewogenheit ggü. Linke</Label>
              <div className="flex items-center gap-1 mt-1">
                {renderRatingStars(ratingData.gewogenheit_linke, (rating) => 
                  setRatingData(prev => ({ ...prev, gewogenheit_linke: rating }))
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="nimmt_texte_an">Nimmt Texte an</Label>
              <div className="flex items-center gap-1 mt-1">
                {renderRatingStars(ratingData.nimmt_texte_an, (rating) => 
                  setRatingData(prev => ({ ...prev, nimmt_texte_an: rating }))
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="freundlichkeit">Freundlichkeit</Label>
              <div className="flex items-center gap-1 mt-1">
                {renderRatingStars(ratingData.freundlichkeit, (rating) => 
                  setRatingData(prev => ({ ...prev, freundlichkeit: rating }))
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsRatingModalOpen(false)}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSubmitRating}
              disabled={isSubmittingRating}
            >
              {isSubmittingRating ? 'Speichere...' : 'Bewertung speichern'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCommentModalOpen} onOpenChange={setIsCommentModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Kommentar hinzufügen</DialogTitle>
            <DialogDescription>
              Füge einen Kommentar zu {selectedJournalist?.vorname} {selectedJournalist?.nachname} hinzu.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="comment">Kommentar (max. 600 Zeichen)</Label>
              <Textarea
                id="comment"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Dein Kommentar..."
                maxLength={600}
                className="mt-1"
                rows={4}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {commentText.length}/600 Zeichen
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsCommentModalOpen(false)}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSubmitComment}
              disabled={isSubmittingComment || !commentText.trim()}
            >
              {isSubmittingComment ? 'Speichere...' : 'Kommentar speichern'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {detailJournalist?.titel && `${detailJournalist.titel} `}
              {detailJournalist?.vorname} {detailJournalist?.nachname}
            </DialogTitle>
            <DialogDescription>
              {detailJournalist?.haus} • {detailJournalist?.medium} • {detailJournalist?.ressort}
            </DialogDescription>
          </DialogHeader>
          
          {detailJournalist && (
            <div className="space-y-6">
              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {detailJournalist.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${detailJournalist.email}`} className="hover:underline">
                      {detailJournalist.email}
                    </a>
                  </div>
                )}
                {detailJournalist.telefon && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${detailJournalist.telefon}`} className="hover:underline">
                      {detailJournalist.telefon}
                    </a>
                  </div>
                )}
              </div>

              {/* Topics */}
              {detailJournalist.themen && detailJournalist.themen.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Themen</h4>
                  <div className="flex flex-wrap gap-2">
                    {detailJournalist.themen.map(thema => (
                      <Badge key={thema} variant="secondary">
                        {thema}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Ratings */}
              {detailJournalist.rating_count > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Bewertungen ({detailJournalist.rating_count})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Zuverlässigkeit</span>
                        <div className="flex items-center gap-1">
                          {renderStars(detailJournalist.avg_zuverlaessigkeit, false)}
                          <span className="text-xs text-muted-foreground ml-1">
                            {detailJournalist.avg_zuverlaessigkeit.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Gewogenheit ggü. Linke</span>
                        <div className="flex items-center gap-1">
                          {renderStars(detailJournalist.avg_gewogenheit_linke, false)}
                          <span className="text-xs text-muted-foreground ml-1">
                            {detailJournalist.avg_gewogenheit_linke.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Nimmt Texte an</span>
                        <div className="flex items-center gap-1">
                          {renderStars(detailJournalist.avg_nimmt_texte_an, false)}
                          <span className="text-xs text-muted-foreground ml-1">
                            {detailJournalist.avg_nimmt_texte_an.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Freundlichkeit</span>
                        <div className="flex items-center gap-1">
                          {renderStars(detailJournalist.avg_freundlichkeit, false)}
                          <span className="text-xs text-muted-foreground ml-1">
                            {detailJournalist.avg_freundlichkeit.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Comments Section */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="comments">
                  <AccordionTrigger>
                    Kommentare ({journalistComments.length})
                  </AccordionTrigger>
                  <AccordionContent>
                    {isLoadingComments ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : journalistComments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Noch keine Kommentare vorhanden.</p>
                    ) : (
                      <div className="space-y-4">
                        {journalistComments.map((comment) => (
                          <div key={comment.id} className="border-l-2 border-muted pl-4">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{comment.author}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm">{comment.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="text-xs text-muted-foreground">
                Hinzugefügt von: {detailJournalist.hinzugefuegt_von} • {new Date(detailJournalist.created_at).toLocaleDateString()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
} 