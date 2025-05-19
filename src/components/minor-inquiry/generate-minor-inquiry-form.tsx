
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AiSubmitButton, AiResultDisplay, FormSection } from "@/components/ai/ai-form-controls";

import type { GenerateMinorInquiryInput, GenerateMinorInquiryOutput } from "@/ai/flows/generate-minor-inquiry";
import { generateMinorInquiry } from "@/ai/flows/generate-minor-inquiry";

const formSchema = z.object({
  topic: z.string().min(5, "Das Thema muss mindestens 5 Zeichen lang sein."),
  context: z.string().min(10, "Der Kontext muss mindestens 10 Zeichen lang sein."),
  desiredOutcome: z.string().min(10, "Das gewünschte Ergebnis muss mindestens 10 Zeichen lang sein."),
  targetAudience: z.string().min(3, "Die Zielgruppe muss mindestens 3 Zeichen lang sein."),
});

type FormValues = GenerateMinorInquiryInput;

const initialState: { result: GenerateMinorInquiryOutput | null; error: string | null } = {
  result: null,
  error: null,
};

async function handleGenerateInquiryAction(
  prevState: typeof initialState,
  formData: FormData
): Promise<typeof initialState> {
  const validatedFields = formSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { result: null, error: "Ungültige Eingabe. Bitte überprüfen Sie die Formularfelder." };
  }
  try {
    const result = await generateMinorInquiry(validatedFields.data);
    return { result, error: null };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Ein unbekannter Fehler ist aufgetreten.";
    return { result: null, error };
  }
}

export function GenerateMinorInquiryForm() {
  const [state, formAction] = useActionState(handleGenerateInquiryAction, initialState);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      context: "",
      desiredOutcome: "",
      targetAudience: "Zuständiges Bundesministerium",
    },
  });

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-8">
        <FormSection title="Details zur Anfrage" description="Geben Sie die Kerninformationen für die Kleine Anfrage an.">
          <FormField
            control={form.control}
            name="topic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Thema</FormLabel>
                <FormControl>
                  <Input placeholder="z.B. Finanzierung von Projekten für erneuerbare Energien" {...field} />
                </FormControl>
                <FormDescription>Das Hauptthema der Anfrage.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="targetAudience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zielgruppe</FormLabel>
                <FormControl>
                  <Input placeholder="z.B. Wirtschaftsministerium, Bundestagsausschuss für Umwelt" {...field} />
                </FormControl>
                <FormDescription>Das spezifische Ministerium oder der Ausschuss, an den sich die Anfrage richtet.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection title="Kontext und Ziele" description="Erläutern Sie den Hintergrund und die Ziele Ihrer Anfrage.">
          <FormField
            control={form.control}
            name="context"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Kontext / Hintergrundinformationen</FormLabel>
                <FormControl>
                  <Textarea placeholder="Geben Sie relevanten Hintergrund, frühere Aussagen oder Datenpunkte an." {...field} rows={4} />
                </FormControl>
                <FormDescription>Detaillierter Kontext zur Information der Anfrage.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="desiredOutcome"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Gewünschtes Ergebnis / Ziel</FormLabel>
                <FormControl>
                  <Textarea placeholder="Welche Informationen oder Maßnahmen erhoffen Sie sich von dieser Anfrage?" {...field} rows={3} />
                </FormControl>
                <FormDescription>Das Hauptziel der Einreichung dieser Anfrage.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <AiSubmitButton isPending={form.formState.isSubmitting} buttonText="Anfrage generieren"/>
      </form>

      <AiResultDisplay
        title={state.result?.title}
        content={state.result ? { title: state.result.title, inquiryText: state.result.inquiryText } : undefined}
        error={state.error}
        defaultMessage="Ihre generierte Kleine Anfrage wird hier erscheinen."
      />
    </Form>
  );
}
