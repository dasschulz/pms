"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Phone, Calendar, Clock, User, Loader2 } from 'lucide-react';

interface SMSCounter {
  count: number;
  month: number;
  year: number;
}

interface NextAppointment {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
}

export default function FraktionsrufPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [counterLoading, setCounterLoading] = useState(true);
  const [appointmentLoading, setAppointmentLoading] = useState(true);
  const [smsCounter, setSmsCounter] = useState<SMSCounter>({ count: 0, month: 1, year: 2024 });
  const [nextAppointment, setNextAppointment] = useState<NextAppointment | null>(null);
  
  // Form state
  const [mdbImPlenum, setMdbImPlenum] = useState('');
  const [thema, setThema] = useState('');
  const [topZeit, setTopZeit] = useState('');
  const [sendMail, setSendMail] = useState(false);
  const [sendSMS, setSendSMS] = useState(false);
  const [webappReminder, setWebappReminder] = useState(false);

  // Check if user has Fraktionsvorstand access
  useEffect(() => {
    if (session && !session.user.isFraktionsvorstand) {
      router.push('/');
      toast.error('Zugriff verweigert. Diese Seite ist nur für Fraktionsvorstand-Mitglieder zugänglich.');
    }
  }, [session, router]);

  // Load SMS counter
  useEffect(() => {
    const loadSMSCounter = async () => {
      try {
        const response = await fetch('/api/fraktionsruf/sms-counter');
        if (response.ok) {
          const data = await response.json();
          setSmsCounter(data);
        }
      } catch (error) {
        console.error('Error loading SMS counter:', error);
      } finally {
        setCounterLoading(false);
      }
    };

    if (session?.user?.isFraktionsvorstand) {
      loadSMSCounter();
    }
  }, [session]);

  // Load next LINKE appointment
  useEffect(() => {
    const loadNextAppointment = async () => {
      try {
        const response = await fetch('/api/tagesordnung/next-linke');
        if (response.ok) {
          const data = await response.json();
          setNextAppointment(data.appointment);
        }
      } catch (error) {
        console.error('Error loading next appointment:', error);
      } finally {
        setAppointmentLoading(false);
      }
    };

    if (session?.user?.isFraktionsvorstand) {
      loadNextAppointment();
    }
  }, [session]);

  const handleAppointmentClick = () => {
    if (nextAppointment) {
      setThema(nextAppointment.title);
      const appointmentDate = new Date(nextAppointment.start);
      setTopZeit(appointmentDate.toLocaleString('de-DE'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mdbImPlenum || !thema || !topZeit) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    if (sendSMS && smsCounter.count >= 6) {
      toast.error('SMS-Limit für diesen Monat erreicht.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/fraktionsruf/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mdbImPlenum,
          thema,
          topZeit,
          sendMail,
          sendSMS,
          webappReminder,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Fraktionsruf erfolgreich versendet!');
        
        // Reset form
        setMdbImPlenum('');
        setThema('');
        setTopZeit('');
        setSendMail(false);
        setSendSMS(false);
        setWebappReminder(false);
        
        // Update SMS counter if SMS was sent
        if (sendSMS) {
          setSmsCounter(prev => ({ ...prev, count: prev.count + 1 }));
        }
      } else {
        toast.error(data.error || 'Fehler beim Versenden des Fraktionsrufs');
      }
    } catch (error) {
      console.error('Error submitting fraktionsruf:', error);
      toast.error('Fehler beim Versenden des Fraktionsrufs');
    } finally {
      setIsLoading(false);
    }
  };

  if (!session?.user?.isFraktionsvorstand) {
    return null; // Will be redirected in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Fraktionsruf
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Neuer Fraktionsruf
                  </CardTitle>
                  
                  {/* SMS Counter at form title height */}
                  {counterLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <div className="text-sm font-medium px-4 py-2 bg-red-100 text-red-800 rounded-lg">
                      SMS: {smsCounter.count}/6
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="mdbImPlenum">Anzahl MdB von uns im Plenum *</Label>
                    <Input
                      id="mdbImPlenum"
                      value={mdbImPlenum}
                      onChange={(e) => setMdbImPlenum(e.target.value)}
                      placeholder="z.B. 2 - Namen der MdBs"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="thema">Thema *</Label>
                    <Input
                      id="thema"
                      value={thema}
                      onChange={(e) => setThema(e.target.value)}
                      placeholder="Name des TOPs, der Anwesenheit erfordert"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="topZeit">Wann ist der TOP *</Label>
                    <Input
                      id="topZeit"
                      value={topZeit}
                      onChange={(e) => setTopZeit(e.target.value)}
                      placeholder="Datum und Uhrzeit"
                      required
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Kommunikationsformen</Label>
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="sendMail"
                          checked={sendMail}
                          onCheckedChange={(checked) => setSendMail(!!checked)}
                        />
                        <Label htmlFor="sendMail">Mail</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="sendSMS"
                          checked={sendSMS}
                          onCheckedChange={(checked) => setSendSMS(!!checked)}
                          disabled={smsCounter.count >= 6}
                        />
                        <Label htmlFor="sendSMS" className={smsCounter.count >= 6 ? 'text-gray-400' : ''}>
                          SMS {smsCounter.count >= 6 ? '(Limit erreicht)' : ''}
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="webappReminder"
                          checked={webappReminder}
                          onCheckedChange={(checked) => setWebappReminder(!!checked)}
                        />
                        <Label htmlFor="webappReminder">Webapp-Reminder</Label>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Wird versendet...
                      </>
                    ) : (
                      'Absenden'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Next LINKE Appointment */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Nächster TOP Linksfraktion
                </CardTitle>
              </CardHeader>
              <CardContent>
                {appointmentLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : nextAppointment ? (
                  <div 
                    className="cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
                    onClick={handleAppointmentClick}
                  >
                    <h4 className="font-medium text-gray-900 mb-2">
                      {nextAppointment.title}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <Clock className="h-4 w-4" />
                      {new Date(nextAppointment.start).toLocaleString('de-DE')}
                    </div>
                    {nextAppointment.description && (
                      <p className="text-sm text-gray-600 mt-2">
                        {nextAppointment.description}
                      </p>
                    )}
                    <p className="text-xs text-blue-600 mt-2">
                      Klicken Sie hier, um die Daten zu übernehmen
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Keine Linksfraktion-Termine gefunden</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 