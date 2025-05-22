
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AiSubmitButton, AiResultDisplay, FormSection } from "@/components/ai/ai-form-controls";

import type { GeneratePressReleaseInput, GeneratePressReleaseOutput } from "@/ai/flows/generate-press-release";
import { generatePressRelease } from "@/ai/flows/generate-press-release";

const formSchema = z.object({
  topic: z.string().min(5, "Das Thema muss mindestens 5 Zeichen lang sein."),
  tone: z.string().min(1, "Ton ist erforderlich."),
  style: z.string().min(1, "Stil ist erforderlich."),
  politicalFocus: z.string().min(3, "Der politische Fokus muss mindestens 3 Zeichen lang sein."),
  targetAudience: z.string().min(3, "Die Zielgruppe muss mindestens 3 Zeichen lang sein."),
  keyMessage: z.string().min(10, "Die Kernbotschaft muss mindestens 10 Zeichen lang sein."),
  additionalContext: z.string().optional(),
});

type FormValues = GeneratePressReleaseInput;

const initialState: { result: GeneratePressReleaseOutput | null; error: string | null } = {
  result: null,
  error: null,
};

async function handleGeneratePressReleaseAction(
  prevState: typeof initialState,
  formData: FormData
): Promise<typeof initialState> {
  const validatedFields = formSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { result: null, error: "Ungültige Eingabe. Bitte überprüfen Sie die Formularfelder." };
  }

  try {
    const result = await generatePressRelease(validatedFields.data);
    return { result, error: null };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Ein unbekannter Fehler ist aufgetreten.";
    return { result: null, error };
  }
}


export function PressReleaseForm() {
  const [state, formAction] = useActionState(handleGeneratePressReleaseAction, initialState);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      tone: "formal", 
      style: "informative", 
      politicalFocus: "",
      targetAudience: "",
      keyMessage: "",
      additionalContext: "",
    },
  });

  const tones = [
    { value: "formal", label: "Formell" },
    { value: "informal", label: "Informell" },
    { value: "urgent", label: "Dringend" },
    { value: "neutral", label: "Neutral" },
    { value: "persuasive", label: "Überzeugend" },
  ];
  const styles = [
    { value: "informative", label: "Informativ" },
    { value: "persuasive", label: "Überzeugend" },
    { value: "narrative", label: "Erzählend" },
    { value: "academic", label: "Akademisch" },
    { value: "journalistic", label: "Journalistisch" },
  ];

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-8">
        <FormSection title="Kerninformationen" description="Definieren Sie die grundlegenden Aspekte Ihrer Pressemitteilung.">
          <FormField
            control={form.control}
            name="topic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Thema</FormLabel>
                <FormControl>
                  <Input placeholder="z.B. Neue Initiative für sozialen Wohnungsbau" {...field} />
                </FormControl>
                <FormDescription>Das Hauptthema der Pressemitteilung.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="keyMessage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kernbotschaft</FormLabel>
                <FormControl>
                  <Textarea placeholder="z.B. Ankündigung eines Plans zum Bau von 10.000 neuen bezahlbaren Wohnungen..." {...field} rows={3} />
                </FormControl>
                <FormDescription>Die Kernbotschaft, die Sie vermitteln möchten.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection title="Stil und Fokus" description="Passen Sie den Kommunikationsstil und den politischen Blickwinkel an.">
           <FormField
            control={form.control}
            name="tone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ton</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Wählen Sie einen Ton" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {tones.map(tone => <SelectItem key={tone.value} value={tone.value}>{tone.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormDescription>Das allgemeine Gefühl der Pressemitteilung.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="style"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stil</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Wählen Sie einen Stil" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {styles.map(style => <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormDescription>Der zu verwendende Schreibstil.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection title="Zielgruppe und Kontext" description="Geben Sie die Zielgruppe und zusätzliche relevante Informationen an.">
          <FormField
            control={form.control}
            name="politicalFocus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Politischer Fokus/Blickwinkel</FormLabel>
                <FormControl>
                  <Input placeholder="z.B. Soziale Gerechtigkeit, Wirtschaftliche Gleichheit" {...field} />
                </FormControl>
                <FormDescription>Der spezifische politische Blickwinkel oder Schwerpunkt.</FormDescription>
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
                  <Input placeholder="z.B. Allgemeine Öffentlichkeit, Parteimitglieder, Spezifische Medien" {...field} />
                </FormControl>
                <FormDescription>Für wen ist diese Pressemitteilung?</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="additionalContext"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Zusätzlicher Kontext (Optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Fügen Sie Hintergrundinformationen, spezifische Datenpunkte oder Zitate hinzu." {...field} rows={4}/>
                </FormControl>
                <FormDescription>Alle weiteren relevanten Informationen für die KI.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>
        
        <AiSubmitButton isPending={form.formState.isSubmitting} buttonText="Pressemitteilung generieren"/>
      </form>

      <AiResultDisplay
        title={state.result?.title}
        content={state.result ? { title: state.result.title, content: state.result.content } : undefined}
        error={state.error}
        defaultMessage="Ihre generierte Pressemitteilung wird hier erscheinen."
      />
    </Form>
  );
}
