'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Send, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UserData {
  userId: string;
  userIdNumber: string;
  name: string;
  firstName: string;
  email: string;
  profilePictureUrl?: string;
  linkRecordId: string;
}

interface TourRequestFormProps {
  userData: UserData;
  token: string;
}

export function TourRequestForm({ userData, token }: TourRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string>('');

  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState({
    kreisverband: '',
    landesverband: '',
    kandidatName: '',
    zeitraum1Von: '',
    zeitraum1Bis: '',
    zeitraum2Von: '',
    zeitraum2Bis: '',
    zeitraum3Von: '',
    zeitraum3Bis: '',
    themen: '',
    video: 'Nein' as 'Ja' | 'Nein',
    ansprechpartner1Name: '',
    ansprechpartner1Phone: '',
    ansprechpartner2Name: '',
    ansprechpartner2Phone: '',
    programmvorschlag: 'möchte ich mit dem Büro klären' as 'füge ich an' | 'möchte ich mit dem Büro klären',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/tour-form/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          token,
          userId: userData.userId,
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ein Fehler ist aufgetreten');
      }
    } catch (error) {
      setError('Ein Fehler ist aufgetreten beim Senden der Anfrage');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Anfrage erfolgreich gesendet!</h1>
                <p className="text-gray-600">
                  Deine Touranfrage wurde erfolgreich an {userData.firstName} gesendet. 
                  Du erhältst eine Antwort an die angegebene E-Mail-Adresse.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with background image/color */}
        <div 
          className="relative h-64 rounded-lg overflow-hidden mb-8 flex items-center justify-center text-white"
          style={{
            backgroundImage: userData.profilePictureUrl 
              ? `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${userData.profilePictureUrl})` 
              : 'linear-gradient(135deg, #dc2626, #b91c1c)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">
              Buch dir {userData.firstName} für den Wahlkampf!
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Ich bitte um einen Wahlkampfeinsatz von {userData.firstName} an folgendem Ort:</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="kreisverband">Kreisverband</Label>
                  <Input
                    id="kreisverband"
                    value={formData.kreisverband}
                    onChange={(e) => setFormData(prev => ({ ...prev, kreisverband: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="landesverband">Landesverband</Label>
                  <Select value={formData.landesverband} onValueChange={(value) => setFormData(prev => ({ ...prev, landesverband: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wähle einen Landesverband" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Baden-Württemberg">Baden-Württemberg</SelectItem>
                      <SelectItem value="Bayern">Bayern</SelectItem>
                      <SelectItem value="Berlin">Berlin</SelectItem>
                      <SelectItem value="Brandenburg">Brandenburg</SelectItem>
                      <SelectItem value="Bremen">Bremen</SelectItem>
                      <SelectItem value="Hamburg">Hamburg</SelectItem>
                      <SelectItem value="Hessen">Hessen</SelectItem>
                      <SelectItem value="Mecklenburg-Vorpommern">Mecklenburg-Vorpommern</SelectItem>
                      <SelectItem value="Niedersachsen">Niedersachsen</SelectItem>
                      <SelectItem value="Nordrhein-Westfalen">Nordrhein-Westfalen</SelectItem>
                      <SelectItem value="Rheinland-Pfalz">Rheinland-Pfalz</SelectItem>
                      <SelectItem value="Saarland">Saarland</SelectItem>
                      <SelectItem value="Sachsen">Sachsen</SelectItem>
                      <SelectItem value="Sachsen-Anhalt">Sachsen-Anhalt</SelectItem>
                      <SelectItem value="Schleswig-Holstein">Schleswig-Holstein</SelectItem>
                      <SelectItem value="Thüringen">Thüringen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="kandidatName">Name Kandidat:in</Label>
                  <Input
                    id="kandidatName"
                    value={formData.kandidatName}
                    onChange={(e) => setFormData(prev => ({ ...prev, kandidatName: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Periods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Folgende Wochen sind für einen Besuch geeignet:
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((num) => (
                <div key={num} className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`zeitraum${num}Von`}>Von (TT.MM.{currentYear})</Label>
                    <Input
                      id={`zeitraum${num}Von`}
                      type="date"
                      value={formData[`zeitraum${num}Von` as keyof typeof formData] as string}
                      onChange={(e) => setFormData(prev => ({ ...prev, [`zeitraum${num}Von`]: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`zeitraum${num}Bis`}>Bis (TT.MM.{currentYear})</Label>
                    <Input
                      id={`zeitraum${num}Bis`}
                      type="date"
                      value={formData[`zeitraum${num}Bis` as keyof typeof formData] as string}
                      onChange={(e) => setFormData(prev => ({ ...prev, [`zeitraum${num}Bis`]: e.target.value }))}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Themes */}
          <Card>
            <CardHeader>
              <CardTitle>Folgende Themen sind besonders wichtig in der Region:</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.themen}
                onChange={(e) => setFormData(prev => ({ ...prev, themen: e.target.value }))}
                rows={4}
                placeholder="Beschreibe die wichtigsten Themen in deiner Region..."
              />
            </CardContent>
          </Card>

          {/* Video Request */}
          <Card>
            <CardHeader>
              <CardTitle>Ich wünsche ein persönliches Video von {userData.firstName} für den Account meines Kreis- oder Landesverbandes:</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={formData.video} onValueChange={(value) => setFormData(prev => ({ ...prev, video: value as 'Ja' | 'Nein' }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ja">Ja</SelectItem>
                  <SelectItem value="Nein">Nein</SelectItem>
                </SelectContent>
              </Select>
              
              {formData.video === 'Ja' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Bitte beachte:</strong> ein fertiges Skript bitte bis <strong>spätestens</strong> eine Woche vor dem Termin an {userData.email} senden!
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Contact Persons */}
          <Card>
            <CardHeader>
              <CardTitle>Folgende Ansprechpartner:innen stehen {userData.firstName} vor Ort zur Verfügung:</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ansprechpartner1Name">Name</Label>
                  <Input
                    id="ansprechpartner1Name"
                    value={formData.ansprechpartner1Name}
                    onChange={(e) => setFormData(prev => ({ ...prev, ansprechpartner1Name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ansprechpartner1Phone">Telefonnummer</Label>
                  <Input
                    id="ansprechpartner1Phone"
                    type="tel"
                    value={formData.ansprechpartner1Phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, ansprechpartner1Phone: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ansprechpartner2Name">Name (optional)</Label>
                  <Input
                    id="ansprechpartner2Name"
                    value={formData.ansprechpartner2Name}
                    onChange={(e) => setFormData(prev => ({ ...prev, ansprechpartner2Name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="ansprechpartner2Phone">Telefonnummer (optional)</Label>
                  <Input
                    id="ansprechpartner2Phone"
                    type="tel"
                    value={formData.ansprechpartner2Phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, ansprechpartner2Phone: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Program Proposal */}
          <Card>
            <CardHeader>
              <CardTitle>Einen Programmvorschlag:</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={formData.programmvorschlag} onValueChange={(value) => setFormData(prev => ({ ...prev, programmvorschlag: value as typeof formData.programmvorschlag }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="füge ich an">füge ich an</SelectItem>
                  <SelectItem value="möchte ich mit dem Büro klären">möchte ich mit dem Büro {userData.name.split(' ').pop()} klären</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Card>
            <CardContent className="pt-6">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2"
                size="lg"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Wird gesendet...' : 'Absenden'}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
} 