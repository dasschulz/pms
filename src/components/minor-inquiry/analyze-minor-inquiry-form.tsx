
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { AiSubmitButton, AiResultDisplay, FormSection } from "@/components/ai/ai-form-controls";
import { Download } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";


import type { AnalyzeMinorInquiryInput, AnalyzeMinorInquiryOutput } from "@/ai/flows/analyze-minor-inquiry";
import { analyzeMinorInquiry } from "@/ai/flows/analyze-minor-inquiry";

const formSchema = z.object({
  inquiryText: z.string().min(20, "Der Anfragetext muss mindestens 20 Zeichen lang sein."),
  responseText: z.string().min(20, "Der Antworttext muss mindestens 20 Zeichen lang sein."),
});

type FormValues = AnalyzeMinorInquiryInput;

const initialState: { result: AnalyzeMinorInquiryOutput | null; error: string | null } = {
  result: null,
  error: null,
};

async function handleAnalyzeInquiryAction(
  prevState: typeof initialState,
  formData: FormData
): Promise<typeof initialState> {
  const validatedFields = formSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { result: null, error: "Ungültige Eingabe. Bitte überprüfen Sie die Formularfelder." };
  }
  try {
    const result = await analyzeMinorInquiry(validatedFields.data);
    return { result, error: null };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Ein unbekannter Fehler ist aufgetreten.";
    return { result: null, error };
  }
}

export function AnalyzeMinorInquiryForm() {
  const [state, formAction] = useActionState(handleAnalyzeInquiryAction, initialState);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inquiryText: "",
      responseText: "",
    },
  });

  const handleDownloadPdf = (content: any, fileName: string) => {
    alert(`PDF-Download für "${fileName}" gestartet. (Dies ist ein Platzhalter)`);
    console.log("Download-Inhalt:", content);
  };

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-8">
        <FormSection title="Anfrage- und Antworttexte" description="Fügen Sie den vollständigen Text der Kleinen Anfrage und der dazugehörigen Antwort ein.">
          <FormField
            control={form.control}
            name="inquiryText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Text der Kleinen Anfrage</FormLabel>
                <FormControl>
                  <Textarea placeholder="Fügen Sie hier den vollständigen Text der Kleinen Anfrage ein..." {...field} rows={8} />
                </FormControl>
                <FormDescription>Der Originaltext der eingereichten Anfrage.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="responseText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Antworttext (Antwort der Bundesregierung)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Fügen Sie hier den vollständigen Text der Regierungsantwort ein..." {...field} rows={8} />
                </FormControl>
                <FormDescription>Die offizielle Antwort auf die Anfrage.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>
        
        <AiSubmitButton isPending={form.formState.isSubmitting} buttonText="Anfrage analysieren" />
      </form>

      {state.result && (
        <div className="mt-6 space-y-4">
          <AiResultDisplay
            title="Analyseergebnisse"
            content={state.result}
            error={state.error}
          />
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleDownloadPdf(state.result, "Bundes-Auswertung.pdf")}
              disabled={!state.result}
            >
              <Download className="mr-2 h-4 w-4" /> Download Bundes-Auswertung (PDF)
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleDownloadPdf(state.result, "Laender-Auswertungen.pdf")}
              disabled={!state.result}
            >
              <Download className="mr-2 h-4 w-4" /> Download 16 Länder-Auswertungen (PDF)
            </Button>
          </div>
           <Card className="mt-4">
            <CardHeader>
                <CardTitle>Führungskräftezitate (Platzhalter)</CardTitle>
                <CardDescription>Schlüsselzitate von Parteiführern zu dieser Anfrage.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">"Diese Analyse liefert entscheidende Einblicke..." - Parteiführer A</p>
                <p className="text-sm text-muted-foreground">"Wir werden auf Grundlage dieser Ergebnisse Maßnahmen ergreifen." - Parteiführer B</p>
            </CardContent>
           </Card>
        </div>
      )}
      {!state.result && state.error && (
         <AiResultDisplay error={state.error} />
      )}
      {!state.result && !state.error && (
        <AiResultDisplay defaultMessage="Analyseergebnisse werden hier nach der Übermittlung angezeigt." />
      )}
    </Form>
  );
}
