"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
// SettingsIcon will be used in the page now
// import { Settings as SettingsIcon } from "lucide-react";

// Button will be used in the page for settings
// import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
// import { Input } from "@/components/ui/input"; // Not used directly if settings fields are removed
import { Textarea } from "@/components/ui/textarea";
import { AiSubmitButton, AiResultDisplay, FormSection } from "@/components/ai/ai-form-controls";
import { VideoScriptSettingsModal, type VideoScriptSettings } from "./video-script-settings-modal";

import type { GenerateVideoScriptInput, GenerateVideoScriptOutput } from "@/ai/flows/generate-video-script";
import { generateVideoScript } from "@/ai/flows/generate-video-script";

const formSchema = z.object({
  strengths: z.string().min(5, "Stärken müssen mindestens 5 Zeichen lang sein."),
  weaknesses: z.string().min(5, "Schwächen müssen mindestens 5 Zeichen lang sein."),
  speakingStyle: z.string().min(1, "Sprechstil ist erforderlich."),
  populismLevel: z.string().min(1, "Populismusniveau ist erforderlich."),
  keyTopics: z.string().min(10, "Schlüsselthemen müssen mindestens 10 Zeichen lang sein."),
});

type VisibleFormValues = Pick<GenerateVideoScriptInput, 'keyTopics'>;

const LOCAL_STORAGE_KEY = "videoScriptSettings";

interface ScriptGenerationState {
  result: GenerateVideoScriptOutput | null;
  error: string | null;
  isPending: boolean;
}

const initialGenerationState: ScriptGenerationState = {
  result: null,
  error: null,
  isPending: false,
};

interface VideoScriptFormProps {
  isSettingsModalOpen: boolean;
  onSettingsModalOpenChange: (isOpen: boolean) => void;
}

export function VideoScriptForm({ isSettingsModalOpen, onSettingsModalOpenChange }: VideoScriptFormProps) {
  const [generationState, setGenerationState] = useState<ScriptGenerationState>(initialGenerationState);
  // isSettingsModalOpen and setIsSettingsModalOpen are now props
  // const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [currentSettings, setCurrentSettings] = useState<VideoScriptSettings>({
    speakerStrengths: "",
    speakerWeaknesses: "",
    speakingStyle: "direct",
    populismLevel: "medium",
  });

  const form = useForm<VisibleFormValues>({
    resolver: zodResolver(formSchema.pick({ keyTopics: true })),
    defaultValues: {
      keyTopics: "",
    },
  });

  useEffect(() => {
    const storedSettings = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedSettings) {
      try {
        const parsedSettings = JSON.parse(storedSettings) as VideoScriptSettings;
        setCurrentSettings(parsedSettings);
      } catch (error) {
        console.error("Error parsing video script settings from localStorage:", error);
        setCurrentSettings({
          speakerStrengths: "",
          speakerWeaknesses: "",
          speakingStyle: "direct",
          populismLevel: "medium",
        });
      }
    }
  }, []);

  const handleSaveSettings = (newSettings: VideoScriptSettings) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSettings));
    setCurrentSettings(newSettings);
    // toast or other confirmation could be handled here or by the modal itself if needed
  };

  const handleClientSubmit = async () => {
    setGenerationState({ result: null, error: null, isPending: true });
    const keyTopicsValue = form.getValues("keyTopics");

    const fullDataToValidate: GenerateVideoScriptInput = {
      strengths: currentSettings.speakerStrengths,
      weaknesses: currentSettings.speakerWeaknesses,
      speakingStyle: currentSettings.speakingStyle,
      populismLevel: currentSettings.populismLevel,
      keyTopics: keyTopicsValue,
    };

    const validatedFields = formSchema.safeParse(fullDataToValidate);

    if (!validatedFields.success) {
      let errorMessages = "Ungültige Eingabe:";
      validatedFields.error.errors.forEach(err => {
        errorMessages += `\n- ${err.path.join('.') || 'Allgemein'}: ${err.message}`;
      });
      if (validatedFields.error.errors.some(e => e.path.includes('keyTopics'))) {
         form.setError("keyTopics", { type: "manual", message: validatedFields.error.errors.find(e => e.path.includes('keyTopics'))?.message || "Schlüsselthemen sind ungültig." });
      }
      setGenerationState({ result: null, error: errorMessages, isPending: false });
      return;
    }

    try {
      const result = await generateVideoScript(validatedFields.data);
      setGenerationState({ result, error: null, isPending: false });
    } catch (e) {
      const error = e instanceof Error ? e.message : "Ein unbekannter Fehler ist aufgetreten.";
      setGenerationState({ result: null, error, isPending: false });
    }
  };

  return (
    <>
      {/* 
        The following button was moved to the page level and is now passed 
        into PageLayout's headerActions slot.
        
        <div className="mb-6 flex justify-end">
          <Button variant="outline" onClick={() => setIsSettingsModalOpen(true)}>
            <SettingsIcon className="mr-2 h-4 w-4" />
            Meine Einstellungen
          </Button>
        </div>
      */}
      <VideoScriptSettingsModal
        isOpen={isSettingsModalOpen} // Prop from parent
        onOpenChange={onSettingsModalOpenChange} // Prop from parent
        initialSettings={currentSettings}
        onSave={handleSaveSettings}
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleClientSubmit)} className="space-y-8">
          <FormSection title="Inhaltlicher Fokus" description="Gib die Schlüsselthemen für das Videoskript an.">
            <FormField
              control={form.control}
              name="keyTopics"
              render={({ field }: { field: any }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Schlüsselthemen</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Liste die Hauptthemen, Argumente oder Punkte für das Video auf. Sei spezifisch."
                      {...field}
                      rows={4}
                    />
                  </FormControl>
                  <FormDescription>Worum soll es im Video gehen?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>
          
          <AiSubmitButton 
            isPending={generationState.isPending} 
            buttonText="Videoskript generieren" 
          />
        </form>
      </Form> 
      <AiResultDisplay
        content={generationState.result?.script}
        error={generationState.error}
        defaultMessage="Dein generiertes Videoskript wird hier erscheinen."
      />
    </>
  );
}
