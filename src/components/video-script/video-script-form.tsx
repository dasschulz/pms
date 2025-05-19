
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AiSubmitButton, AiResultDisplay, FormSection } from "@/components/ai/ai-form-controls";

import type { GenerateVideoScriptInput, GenerateVideoScriptOutput } from "@/ai/flows/generate-video-script";
import { generateVideoScript } from "@/ai/flows/generate-video-script";

const formSchema = z.object({
  strengths: z.string().min(5, "Stärken müssen mindestens 5 Zeichen lang sein."),
  weaknesses: z.string().min(5, "Schwächen müssen mindestens 5 Zeichen lang sein."),
  speakingStyle: z.string().min(1, "Sprechstil ist erforderlich."),
  populismLevel: z.string().min(1, "Populismusniveau ist erforderlich."),
  keyTopics: z.string().min(10, "Schlüsselthemen müssen mindestens 10 Zeichen lang sein."),
});

type FormValues = GenerateVideoScriptInput;

const initialState: { result: GenerateVideoScriptOutput | null; error: string | null } = {
  result: null,
  error: null,
};

async function handleGenerateScriptAction(
  prevState: typeof initialState,
  formData: FormData
): Promise<typeof initialState> {
  const validatedFields = formSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { result: null, error: "Ungültige Eingabe. Bitte überprüfen Sie die Formularfelder." };
  }
  try {
    const result = await generateVideoScript(validatedFields.data);
    return { result, error: null };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Ein unbekannter Fehler ist aufgetreten.";
    return { result: null, error };
  }
}

export function VideoScriptForm() {
  const [state, formAction] = useActionState(handleGenerateScriptAction, initialState);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      strengths: "",
      weaknesses: "",
      speakingStyle: "direct", 
      populismLevel: "medium", 
      keyTopics: "",
    },
  });
  
  const speakingStyles = [
    { value: "direct", label: "Direkt" },
    { value: "conversational", label: "Gesprächig" },
    { value: "energetic", label: "Energetisch" },
    { value: "calm", label: "Ruhig" },
    { value: "humorous", label: "Humorvoll" },
  ];
  const populismLevels = [
    { value: "low", label: "Niedrig" },
    { value: "medium", label: "Mittel" },
    { value: "high", label: "Hoch" },
    { value: "none", label: "Kein" },
  ];

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-8">
        <FormSection title="Sprecherprofil" description="Beschreiben Sie die Eigenschaften des Sprechers.">
          <FormField
            control={form.control}
            name="strengths"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stärken des Sprechers</FormLabel>
                <FormControl>
                  <Input placeholder="z.B. Charismatisch, Kenntnisreich in X" {...field} />
                </FormControl>
                <FormDescription>Was sind die Stärken des Sprechers?</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="weaknesses"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Schwächen des Sprechers</FormLabel>
                <FormControl>
                  <Input placeholder="z.B. Kann zu akademisch sein, Spricht manchmal schnell" {...field} />
                </FormControl>
                <FormDescription>In welchen Bereichen kann sich der Sprecher verbessern?</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection title="Skriptstil" description="Definieren Sie Stil und Ton des Videoskripts.">
          <FormField
            control={form.control}
            name="speakingStyle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sprechstil</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Wählen Sie einen Sprechstil" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {speakingStyles.map(style => <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormDescription>Der gewünschte Vortragsstil für das Video.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="populismLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Populismusniveau</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Wählen Sie ein Populismusniveau" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {populismLevels.map(level => <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormDescription>Der Grad der populistischen Rhetorik, die einbezogen werden soll.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection title="Inhaltlicher Fokus" description="Geben Sie die Schlüsselthemen für das Videoskript an.">
          <FormField
            control={form.control}
            name="keyTopics"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Schlüsselthemen</FormLabel>
                <FormControl>
                  <Textarea placeholder="Listen Sie die Hauptthemen, Argumente oder Punkte für das Video auf. Seien Sie spezifisch." {...field} rows={4}/>
                </FormControl>
                <FormDescription>Worum soll es im Video gehen?</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>
        
        <AiSubmitButton isPending={form.formState.isSubmitting} buttonText="Videoskript generieren"/>
      </form>

      <AiResultDisplay
        content={state.result?.script}
        error={state.error}
        defaultMessage="Ihr generiertes Videoskript wird hier erscheinen."
      />
    </Form>
  );
}
