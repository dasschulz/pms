
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

import type { WriteSpeechInput, WriteSpeechOutput } from "@/ai/flows/write-speech";
import { writeSpeech } from "@/ai/flows/write-speech";

const formSchema = z.object({
  topic: z.string().min(5, "Das Thema muss mindestens 5 Zeichen lang sein."),
  tone: z.string().min(1, "Ton ist erforderlich."),
  style: z.string().min(1, "Stil ist erforderlich."),
  politicalFocus: z.string().min(3, "Der politische Fokus muss mindestens 3 Zeichen lang sein."),
  targetAudience: z.string().min(3, "Die Zielgruppe muss mindestens 3 Zeichen lang sein."),
  keyMessage: z.string().min(10, "Die Kernbotschaft muss mindestens 10 Zeichen lang sein."),
});

type FormValues = WriteSpeechInput;

const initialState: { result: WriteSpeechOutput | null; error: string | null } = {
  result: null,
  error: null,
};

async function handleWriteSpeechAction(
  prevState: typeof initialState,
  formData: FormData
): Promise<typeof initialState> {
  const validatedFields = formSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { result: null, error: "Ungültige Eingabe. Bitte überprüfen Sie die Formularfelder." };
  }
  try {
    const result = await writeSpeech(validatedFields.data);
    return { result, error: null };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Ein unbekannter Fehler ist aufgetreten.";
    return { result: null, error };
  }
}

export function SpeechWriterForm() {
  const [state, formAction] = useActionState(handleWriteSpeechAction, initialState);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      tone: "persuasive", 
      style: "formal", 
      politicalFocus: "",
      targetAudience: "Allgemeine Öffentlichkeit", 
      keyMessage: "",
    },
  });
  
  const tones = [
    { value: "formal", label: "Formell" },
    { value: "informal", label: "Informell" },
    { value: "persuasive", label: "Überzeugend" },
    { value: "inspirational", label: "Inspirierend" },
    { value: "condemnatory", label: "Verurteilend" },
    { value: "celebratory", label: "Feierlich" },
  ];
  const styles = [
    { value: "academic", label: "Akademisch" },
    { value: "journalistic", label: "Journalistisch" },
    { value: "narrative", label: "Erzählend" },
    { value: "argumentative", label: "Argumentativ" },
    { value: "expository", label: "Erläuternd" },
  ];


  return (
    <Form {...form}>
      <form action={formAction} className="space-y-8">
        <FormSection title="Kernelemente der Rede" description="Definieren Sie das Hauptthema und die zentrale Botschaft Ihrer Rede.">
           <FormField
            control={form.control}
            name="topic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Thema</FormLabel>
                <FormControl>
                  <Input placeholder="z.B. Die Zukunft der Arbeit" {...field} />
                </FormControl>
                <FormDescription>Das Hauptthema der Rede.</FormDescription>
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
                  <Textarea placeholder="z.B. Wir müssen uns an technologische Veränderungen anpassen und gleichzeitig den Arbeitnehmerschutz gewährleisten." {...field} rows={3}/>
                </FormControl>
                <FormDescription>Die Kernbotschaft, die das Publikum mitnehmen soll.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection title="Vortragsstil" description="Passen Sie Ton und Schreibstil dem Anlass an.">
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
                <FormDescription>Die allgemeine emotionale Qualität der Rede.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="style"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Schreibstil</FormLabel>
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
                <FormDescription>Der rhetorische und strukturelle Stil der Rede.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>
        
        <FormSection title="Zielgruppe und Fokus" description="Richten Sie die Rede auf Ihre Zielgruppe und den politischen Kontext aus.">
          <FormField
            control={form.control}
            name="politicalFocus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Politischer Fokus</FormLabel>
                <FormControl>
                  <Input placeholder="z.B. Soziale Gerechtigkeit, Umweltpolitik" {...field} />
                </FormControl>
                <FormDescription>Der spezifische politische Blickwinkel oder das Thema.</FormDescription>
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
                  <Input placeholder="z.B. Parteitag, Öffentliche Kundgebung, Parlamentsdebatte" {...field} />
                </FormControl>
                <FormDescription>An wen richten Sie diese Rede?</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>
        
        <AiSubmitButton isPending={form.formState.isSubmitting} buttonText="Rede generieren"/>
      </form>

      <AiResultDisplay
        content={state.result?.speechDraft}
        error={state.error}
        defaultMessage="Ihr generierter Redeentwurf wird hier erscheinen."
      />
    </Form>
  );
}
