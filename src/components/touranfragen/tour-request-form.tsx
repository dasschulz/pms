'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
      <div className="px-4 py-16">
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
    <div 
      className="px-4 py-8 min-h-screen text-white"
      style={{
        backgroundColor: 'hsl(0 100% 50%)',
        backgroundImage: `
          radial-gradient(circle at 20% 30%, hsl(326 100% 22%) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, hsl(326 100% 22%) 0%, transparent 60%),
          radial-gradient(circle at 60% 20%, hsl(326 100% 22%) 0%, transparent 45%),
          url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")
        `
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-left text-8xl font-black font-work-sans mb-2 text-white leading-none">
            Buch dir<br />
            {userData.firstName} für<br />
            den Wahlkampf!
          </h1>
        </div>

        {/* Main Form Card */}
        <Card className="bg-background/5 backdrop-blur-3xl border border-white/20 shadow-2xl shadow-white/10">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <Alert variant="destructive" className="bg-destructive/10 backdrop-blur-xl border-destructive/20">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-light font-work-sans text-white">Ich bitte um einen Wahlkampfeinsatz von {userData.firstName} an folgendem Ort:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="kreisverband" className="text-white">Kreisverband</Label>
                    <Input
                      id="kreisverband"
                      value={formData.kreisverband}
                      onChange={(e) => setFormData(prev => ({ ...prev, kreisverband: e.target.value }))}
                      required
                      className="bg-background/10 backdrop-blur-xl border-white/20 text-white placeholder:text-white/60"
                    />
                  </div>
                  <div>
                    <Label htmlFor="landesverband" className="text-white">Landesverband</Label>
                    <Select value={formData.landesverband} onValueChange={(value) => setFormData(prev => ({ ...prev, landesverband: value }))}>
                      <SelectTrigger className="bg-background/10 backdrop-blur-xl border-white/20 text-white">
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
                    <Label htmlFor="kandidatName" className="text-white">Name Kandidat:in</Label>
                    <Input
                      id="kandidatName"
                      value={formData.kandidatName}
                      onChange={(e) => setFormData(prev => ({ ...prev, kandidatName: e.target.value }))}
                      required
                      className="bg-background/10 backdrop-blur-xl border-white/20 text-white placeholder:text-white/60"
                    />
                  </div>
                </div>
              </div>

              {/* Time Periods */}
              <div className="space-y-4">
                <h3 className="text-lg font-light font-work-sans flex items-center gap-2 text-white">
                  <Calendar className="h-5 w-5" />
                  Folgende Wochen sind für einen Besuch geeignet:
                </h3>
                <div className="space-y-4">
                  {[1, 2, 3].map((num) => (
                    <div key={num} className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`zeitraum${num}Von`} className="text-white">Von (TT.MM.{currentYear})</Label>
                        <Input
                          id={`zeitraum${num}Von`}
                          type="date"
                          value={formData[`zeitraum${num}Von` as keyof typeof formData] as string}
                          onChange={(e) => setFormData(prev => ({ ...prev, [`zeitraum${num}Von`]: e.target.value }))}
                          className="bg-background/10 backdrop-blur-xl border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`zeitraum${num}Bis`} className="text-white">Bis (TT.MM.{currentYear})</Label>
                        <Input
                          id={`zeitraum${num}Bis`}
                          type="date"
                          value={formData[`zeitraum${num}Bis` as keyof typeof formData] as string}
                          onChange={(e) => setFormData(prev => ({ ...prev, [`zeitraum${num}Bis`]: e.target.value }))}
                          className="bg-background/10 backdrop-blur-xl border-white/20 text-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Themes */}
              <div className="space-y-4">
                <h3 className="text-lg font-light font-work-sans text-white">Folgende Themen sind besonders wichtig in der Region:</h3>
                <Textarea
                  value={formData.themen}
                  onChange={(e) => setFormData(prev => ({ ...prev, themen: e.target.value }))}
                  rows={4}
                  placeholder="Beschreibe die wichtigsten Themen in deiner Region..."
                  className="bg-background/10 backdrop-blur-xl border-white/20 text-white placeholder:text-white/60"
                />
              </div>

              {/* Video Request - Radio Group */}
              <div className="space-y-4">
                <h3 className="text-lg font-light font-work-sans text-white">Ich wünsche ein persönliches Video von {userData.firstName} für den Account meines Kreis- oder Landesverbandes:</h3>
                <RadioGroup
                  value={formData.video}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, video: value as 'Ja' | 'Nein' }))}
                  className="flex flex-row space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Ja" id="video-ja" className="border-white text-white data-[state=checked]:bg-white data-[state=checked]:text-red-600" />
                    <Label htmlFor="video-ja" className="text-white">Ja</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Nein" id="video-nein" className="border-white text-white data-[state=checked]:bg-white data-[state=checked]:text-red-600" />
                    <Label htmlFor="video-nein" className="text-white">Nein</Label>
                  </div>
                </RadioGroup>
                
                {formData.video === 'Ja' && (
                  <Alert className="bg-background/5 backdrop-blur-xl border-white/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-white">
                      <strong>Bitte beachte:</strong> ein fertiges Skript bitte bis <strong>spätestens</strong> eine Woche vor dem Termin an {userData.email} senden!
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Contact Persons */}
              <div className="space-y-4">
                <h3 className="text-lg font-light font-work-sans text-white">Folgende Ansprechpartner:innen stehen {userData.firstName} vor Ort zur Verfügung:</h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ansprechpartner1Name" className="text-white">Name</Label>
                      <Input
                        id="ansprechpartner1Name"
                        value={formData.ansprechpartner1Name}
                        onChange={(e) => setFormData(prev => ({ ...prev, ansprechpartner1Name: e.target.value }))}
                        required
                        className="bg-background/10 backdrop-blur-xl border-white/20 text-white placeholder:text-white/60"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ansprechpartner1Phone" className="text-white">Telefonnummer</Label>
                      <Input
                        id="ansprechpartner1Phone"
                        type="tel"
                        value={formData.ansprechpartner1Phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, ansprechpartner1Phone: e.target.value }))}
                        required
                        className="bg-background/10 backdrop-blur-xl border-white/20 text-white placeholder:text-white/60"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ansprechpartner2Name" className="text-white">Name (optional)</Label>
                      <Input
                        id="ansprechpartner2Name"
                        value={formData.ansprechpartner2Name}
                        onChange={(e) => setFormData(prev => ({ ...prev, ansprechpartner2Name: e.target.value }))}
                        className="bg-background/10 backdrop-blur-xl border-white/20 text-white placeholder:text-white/60"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ansprechpartner2Phone" className="text-white">Telefonnummer (optional)</Label>
                      <Input
                        id="ansprechpartner2Phone"
                        type="tel"
                        value={formData.ansprechpartner2Phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, ansprechpartner2Phone: e.target.value }))}
                        className="bg-background/10 backdrop-blur-xl border-white/20 text-white placeholder:text-white/60"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Program Proposal - Radio Group */}
              <div className="space-y-4">
                <h3 className="text-lg font-light font-work-sans text-white">Einen Programmvorschlag:</h3>
                <RadioGroup
                  value={formData.programmvorschlag}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, programmvorschlag: value as typeof formData.programmvorschlag }))}
                  className="flex flex-row space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="füge ich an" id="programm-anhang" className="border-white text-white data-[state=checked]:bg-white data-[state=checked]:text-red-600" />
                    <Label htmlFor="programm-anhang" className="text-white">füge ich an</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="möchte ich mit dem Büro klären" id="programm-buero" className="border-white text-white data-[state=checked]:bg-white data-[state=checked]:text-red-600" />
                    <Label htmlFor="programm-buero" className="text-white">möchte ich mit dem Büro {userData.name.split(' ').pop()} klären</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-background/5 backdrop-blur-xl border border-white/20 text-white hover:bg-background/10 transition-colors"
                  size="lg"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? 'Wird gesendet...' : 'Absenden'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 