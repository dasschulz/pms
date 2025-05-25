'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, HelpCircle, FileQuestion, CheckCircle, AlertTriangle, Copy, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FormLabel, FormDescription } from '@/components/ui/form';
import { FileText } from 'lucide-react';

interface GeneratedQuestion {
  question: string;
  characterCount: number;
  isValid: boolean;
  validationIssues: string[];
  suggestions: string[];
}

export default function SchriftlicheFragenPage() {
  const [context, setContext] = useState('');
  const [specificFocus, setSpecificFocus] = useState('');
  const [generatedQuestion, setGeneratedQuestion] = useState<GeneratedQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedQuestions, setSavedQuestions] = useState<GeneratedQuestion[]>([]);

  const handleGenerate = async () => {
    if (!context.trim() && !specificFocus.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/schriftliche-fragen/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: context.trim(),
          specificFocus: specificFocus.trim()
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setGeneratedQuestion(data.question);
      } else {
        console.error('Generation failed:', data.error);
      }
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateQuestion = (question: string): { isValid: boolean; issues: string[]; characterCount: number } => {
    const issues: string[] = [];
    const characterCount = question.length;

    // Character limit check
    if (characterCount > 1800) {
      issues.push(`Überschreitung der Zeichengrenze: ${characterCount}/1800 Zeichen`);
    }

    // Must be a question
    if (!question.trim().endsWith('?')) {
      issues.push('Muss mit einem Fragezeichen enden');
    }

    // Check for forbidden elements
    if (question.includes('Begründung:') || question.includes('Einleitung:')) {
      issues.push('Begründungen und Einleitungen sind unzulässig');
    }

    // Check for statements vs questions
    const sentences = question.split(/[.!]/).filter(s => s.trim().length > 0);
    const questionSentences = question.split('?').filter(s => s.trim().length > 0);
    
    if (sentences.length > questionSentences.length) {
      issues.push('Nur Fragesätze sind zulässig, keine Aussagesätze');
    }

    // Check for too many sub-questions
    const questionMarks = (question.match(/\?/g) || []).length;
    if (questionMarks > 2) {
      issues.push('Maximal zwei Unterfragen erlaubt');
    }

    return {
      isValid: issues.length === 0 && characterCount <= 1800,
      issues,
      characterCount
    };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const saveQuestion = () => {
    if (generatedQuestion) {
      setSavedQuestions(prev => [...prev, generatedQuestion]);
    }
  };

  const exportQuestions = () => {
    const content = savedQuestions.map((q, i) => 
      `Schriftliche Frage ${i + 1}:\n${q.question}\n\nZeichen: ${q.characterCount}/1800\n\n`
    ).join('---\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schriftliche-fragen.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const rules = [
    {
      title: "Überschriften",
      description: "Überschriften sind unzulässig"
    },
    {
      title: "Begründungen",
      description: "Begründungen, Einleitungen oder Vorbemerkungen sind unzulässig"
    },
    {
      title: "Verantwortungsbereich",
      description: "Nur Fragen aus Bereichen der Bundesregierung sind zulässig"
    },
    {
      title: "Sachlichkeitsgebot",
      description: "Keine unsachlichen, beleidigenden oder polemischen Formulierungen"
    },
    {
      title: "Bestimmtheit",
      description: "Fragen müssen ohne Fachkenntnisse verständlich sein"
    },
    {
      title: "Umfang",
      description: "Maximal 1800 Zeichen, höchstens zwei Unterfragen"
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileQuestion className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Schriftliche Fragen</h1>
            <p className="text-muted-foreground">
              AI-unterstützte Generierung von schriftlichen Fragen nach GOBT-Regeln
            </p>
          </div>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <HelpCircle className="h-4 w-4 mr-2" />
              Regeln anzeigen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Regeln für Schriftliche Fragen</DialogTitle>
              <DialogDescription>
                Wichtige Vorgaben der Geschäftsordnung des Bundestages
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[60vh]">
              <div className="space-y-4">
                {rules.map((rule, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{rule.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Frage generieren</CardTitle>
            <CardDescription>
              Gibt das Thema und den Kontext für deine schriftliche Frage an
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="context">Kontext/Hintergrund</Label>
              <Textarea
                id="context"
                placeholder="Kurze Beschreibung des Sachverhalts oder Anlasses..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="focus">Zielstellung</Label>
              <Input
                id="focus"
                placeholder="Worauf soll die Frage genau abzielen?"
                value={specificFocus}
                onChange={(e) => setSpecificFocus(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={loading || (!context.trim() && !specificFocus.trim())}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileQuestion className="h-4 w-4 mr-2" />
              )}
              Frage generieren
            </Button>
          </CardContent>
        </Card>

        {/* Generated Question */}
        {generatedQuestion && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Generierte Frage</CardTitle>
                <CardDescription>
                  Überprüfe und optimiere die generierte Frage.
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => generatedQuestion && copyToClipboard(generatedQuestion.question)}>
                <Copy className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <Textarea
                  value={generatedQuestion.question}
                  onChange={(e) => {
                    const validation = validateQuestion(e.target.value);
                    setGeneratedQuestion({
                      ...generatedQuestion,
                      question: e.target.value,
                      characterCount: validation.characterCount,
                      isValid: validation.isValid,
                      validationIssues: validation.issues
                    });
                  }}
                  rows={6}
                  className="font-mono"
                />
                
                <div className="flex items-center justify-between">
                  <Badge 
                    variant={generatedQuestion.isValid ? "default" : "destructive"}
                    className="flex items-center space-x-1"
                  >
                    {generatedQuestion.isValid ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <AlertTriangle className="h-3 w-3" />
                    )}
                    <span>
                      {generatedQuestion.isValid ? 'Gültig' : 'Validierungsfehler'}
                    </span>
                  </Badge>
                  
                  <Badge 
                    variant={generatedQuestion.characterCount > 1800 ? "destructive" : "secondary"}
                  >
                    {generatedQuestion.characterCount}/1800 Zeichen
                  </Badge>
                </div>

                {generatedQuestion.validationIssues.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1">
                        {generatedQuestion.validationIssues.map((issue, index) => (
                          <li key={index} className="text-sm">{issue}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {generatedQuestion.suggestions.length > 0 && (
                  <Alert>
                    <HelpCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-semibold mb-2">Verbesserungsvorschläge:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {generatedQuestion.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-sm">{suggestion}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Saved Questions */}
      {savedQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Gespeicherte Fragen ({savedQuestions.length})
              <Button
                variant="outline"
                size="sm"
                onClick={exportQuestions}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportieren
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {savedQuestions.map((question, index) => (
                <Card key={index} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">Frage {index + 1}</h4>
                      <div className="flex space-x-2">
                        <Badge 
                          variant={question.isValid ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {question.characterCount}/1800
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(question.question)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm font-mono whitespace-pre-wrap">
                      {question.question}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 