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
import { Download, UploadCloud } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import type { AnalyzeMinorInquiryInput, AnalyzeMinorInquiryOutput } from "@/ai/flows/analyze-minor-inquiry";
import { analyzeMinorInquiry } from "@/ai/flows/analyze-minor-inquiry";

const formSchema = z.object({
  inquiryText: z.any().refine((files) => files?.length === 1, "Bitte laden Sie eine PDF-Datei hoch."),
  responseText: z.string().min(5, "Die Definition der Schwerpunkte muss mindestens 5 Zeichen lang sein."),
});

type FormValues = z.infer<typeof formSchema>;

const initialState: { result: AnalyzeMinorInquiryOutput | null; error: string | null } = {
  result: null,
  error: null,
};

async function handleAnalyzeInquiryAction(
  prevState: typeof initialState,
  formData: FormData
): Promise<typeof initialState> {
  const inquiryFile = formData.get('inquiryText') as File | null;
  const responseText = formData.get('responseText') as string | null;

  if (!inquiryFile || inquiryFile.size === 0) {
    return { result: null, error: "Bitte laden Sie die Antwort der Bundesregierung als PDF hoch." };
  }
  if (!responseText || responseText.length < 5) {
    return { result: null, error: "Die Definition der Schwerpunkte ist zu kurz."}
  }

  const validatedData = {
    inquiryText: inquiryFile,
    responseText: responseText,
  };
  console.log("Form data to be processed (client-side):", validatedData);

  try {
    const result = await analyzeMinorInquiry(validatedData);
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
      inquiryText: undefined,
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
          <div className="flex flex-row gap-4 items-start">
            <FormField
              control={form.control}
              name="inquiryText"
              render={({ field }) => (
                <FormItem className="w-1/5 flex flex-col">
                  <FormLabel>Antwort der Bundesregierung hochladen</FormLabel>
                  <FormControl 
                    className="flex-grow min-h-[160px] border-dashed border-2 rounded-md \
                               flex flex-col items-center justify-center p-4 hover:border-primary cursor-pointer"
                    onClick={() => document.getElementById('file-upload-input')?.click()}
                  >
                    <div className="text-center">
                      <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-1 text-sm text-gray-600">
                        {field.value?.[0]?.name || "PDF hierher ziehen oder klicken"}
                      </p>
                      <Input 
                        id="file-upload-input"
                        type="file" 
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          field.onChange(e.target.files);
                        }}
                        ref={field.ref}
                        name={field.name}
                        onBlur={field.onBlur}
                        disabled={field.disabled}
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="mt-1">Der Originaltext der eingereichten Anfrage.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="responseText"
              render={({ field }) => (
                <FormItem className="w-4/5">
                  <FormLabel>Schwerpunkte definieren</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Welche Datenpunkte sollen im Ländervergleich hervorgehoben werden?" {...field} rows={8} className="min-h-[160px]" />
                  </FormControl>
                  <FormDescription>Die offizielle Antwort auf die Anfrage.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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
