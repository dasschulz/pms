"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";

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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import type { GenerateMinorInquiryInput, GenerateMinorInquiryOutput } from "@/ai/flows/generate-minor-inquiry";
import { useMdBUsers } from "@/hooks/use-mdb-users";
import { useSession } from "next-auth/react";

const formSchema = z.object({
  topic: z.string().min(5, "Das Thema muss mindestens 5 Zeichen lang sein."),
  context: z.string().min(10, "Der Kontext muss mindestens 10 Zeichen lang sein."),
  desiredOutcome: z.string().min(10, "Das gewünschte Ergebnis muss mindestens 10 Zeichen lang sein."),
  targetAudience: z.string().min(3, "Die Zielgruppe muss mindestens 3 Zeichen lang sein."),
});

type FormValues = GenerateMinorInquiryInput;

export function GenerateMinorInquiryForm() {
  const { data: users, isLoading: usersLoading } = useMdBUsers();
  const { data: session } = useSession();
  const [result, setResult] = useState<GenerateMinorInquiryOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      context: "",
      desiredOutcome: "",
      targetAudience: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!session) {
      setError("Bitte melden Sie sich an.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/minor-inquiry/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Fehler bei der Anfrage");
      } else {
        setResult({ title: data.title, inquiryText: data.inquiryText });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    }
    setIsLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                <FormLabel>Beteiligte MdB</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Wählen Sie MdB aus" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {usersLoading ? (
                      <SelectItem value="loading" disabled>Lade...</SelectItem>
                    ) : (
                      users?.map((user) => (
                        <SelectItem key={user.id} value={String(user.id)}>
                          {user.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormDescription>Wählen Sie die MdBs, die an dieser Anfrage beteiligt sind.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection title="Kontext und Ziele" description="Erläutern Sie den Hintergrund und die Ziele Ihrer Anfrage.">
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
          <FormField
            control={form.control}
            name="context"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Kontext / Hintergrundinformationen</FormLabel>
                <FormControl>
                  <Textarea placeholder="Geben Sie relevanten Hintergrund, frühere Aussagen oder Datenpunkte an." {...field} rows={4} />
                </FormControl>
                <FormDescription>Detaillierter Kontext zur Information der Anfrage. Sie können auch gerne einfache Links zu Nachrichtenartikeln eingeben.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <AiSubmitButton isPending={isLoading} buttonText="Anfrage generieren"/>
      </form>

      <AiResultDisplay
        title={result?.title}
        content={result ? { title: result.title, inquiryText: result.inquiryText } : undefined}
        error={error}
        defaultMessage="Ihre generierte Kleine Anfrage wird hier erscheinen."
      />
    </Form>
  );
}
