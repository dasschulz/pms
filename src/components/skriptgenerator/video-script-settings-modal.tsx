"use client";

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface VideoScriptSettings {
  speakerStrengths: string;
  speakerWeaknesses: string;
  speakingStyle: string;
  populismLevel: string;
}

interface VideoScriptSettingsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  initialSettings: Partial<VideoScriptSettings>;
  onSave: (settings: VideoScriptSettings) => void;
}

const speakingStylesOptions = [
  { value: "direct", label: "Direkt" },
  { value: "conversational", label: "Gesprächig" },
  { value: "energetic", label: "Energetisch" },
  { value: "calm", label: "Ruhig" },
  { value: "humorous", label: "Humorvoll" },
];

const populismLevelsOptions = [
  { value: "low", label: "Niedrig" },
  { value: "medium", label: "Mittel" },
  { value: "high", label: "Hoch" },
  { value: "none", label: "Kein" },
];

export function VideoScriptSettingsModal({
  isOpen,
  onOpenChange,
  initialSettings,
  onSave,
}: VideoScriptSettingsModalProps) {
  const [speakerStrengths, setSpeakerStrengths] = useState(initialSettings.speakerStrengths || "");
  const [speakerWeaknesses, setSpeakerWeaknesses] = useState(initialSettings.speakerWeaknesses || "");
  const [speakingStyle, setSpeakingStyle] = useState(initialSettings.speakingStyle || "direct");
  const [populismLevel, setPopulismLevel] = useState(initialSettings.populismLevel || "medium");

  useEffect(() => {
    setSpeakerStrengths(initialSettings.speakerStrengths || "");
    setSpeakerWeaknesses(initialSettings.speakerWeaknesses || "");
    setSpeakingStyle(initialSettings.speakingStyle || "direct");
    setPopulismLevel(initialSettings.populismLevel || "medium");
  }, [initialSettings, isOpen]); // Reset form when initialSettings change or modal reopens

  const handleSave = () => {
    const newSettings: VideoScriptSettings = {
      speakerStrengths,
      speakerWeaknesses,
      speakingStyle,
      populismLevel,
    };
    onSave(newSettings);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Meine Video-Skript Einstellungen</DialogTitle>
          <DialogDescription>
            Definieren Sie Standardwerte für Ihr Sprecherprofil und den Skriptstil. Diese werden für neue Skripte verwendet.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <h3 className="font-semibold text-lg">Sprecherprofil</h3>
          <div className="grid gap-3">
            <Label htmlFor="speakerStrengths">Stärken des Sprechers</Label>
            <Input
              id="speakerStrengths"
              value={speakerStrengths}
              onChange={(e) => setSpeakerStrengths(e.target.value)}
              placeholder="z.B. Charismatisch, Kenntnisreich in X"
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="speakerWeaknesses">Schwächen des Sprechers</Label>
            <Input
              id="speakerWeaknesses"
              value={speakerWeaknesses}
              onChange={(e) => setSpeakerWeaknesses(e.target.value)}
              placeholder="z.B. Kann zu akademisch sein, Spricht manchmal schnell"
            />
          </div>
          
          <h3 className="font-semibold text-lg mt-4">Skriptstil</h3>
          <div className="grid gap-3">
            <Label htmlFor="speakingStyle">Sprechstil</Label>
            <Select value={speakingStyle} onValueChange={setSpeakingStyle}>
              <SelectTrigger id="speakingStyle">
                <SelectValue placeholder="Wählen Sie einen Sprechstil" />
              </SelectTrigger>
              <SelectContent>
                {speakingStylesOptions.map(style => (
                  <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3">
            <Label htmlFor="populismLevel">Populismusniveau</Label>
            <Select value={populismLevel} onValueChange={setPopulismLevel}>
              <SelectTrigger id="populismLevel">
                <SelectValue placeholder="Wählen Sie ein Populismusniveau" />
              </SelectTrigger>
              <SelectContent>
                {populismLevelsOptions.map(level => (
                  <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Abbrechen</Button>
          </DialogClose>
          <Button onClick={handleSave}>Einstellungen speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 