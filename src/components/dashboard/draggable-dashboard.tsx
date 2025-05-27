"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WeatherCard } from "./weather-card";
import { TrainCard } from "./train-card";
import { LatestSpeechCard } from "./latest-speech-card";
import { 
  Settings, 
  Grip,
  Check,
  X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface WidgetConfig {
  id: string;
  name: string;
  component: React.ComponentType<any>;
  props?: any;
  defaultActive: boolean;
  category: "info" | "tools" | "activity";
}

interface DraggableDashboardProps {
  userName: string;
  initialPreferences?: {
    widgetOrder: string[];
    activeWidgets: string[];
    themePreference: 'light' | 'dark' | 'system';
  };
}

export function DraggableDashboard({ userName, initialPreferences }: DraggableDashboardProps) {
  // Define all available widgets
  const availableWidgets: WidgetConfig[] = [
    {
      id: "weather",
      name: "Wetter",
      component: WeatherCard,
      props: { city: "Berlin", electoralDistrict: "Musterwahlkreis" },
      defaultActive: true,
      category: "info"
    },
    {
      id: "trains",
      name: "Zugverbindungen",
      component: TrainCard,
      props: {},
      defaultActive: true,
      category: "info"
    },
    {
      id: "latest-speech",
      name: "Letzte Rede",
      component: LatestSpeechCard,
      props: {},
      defaultActive: true,
      category: "info"
    },
    {
      id: "activity",
      name: "Letzte Aktivitäten",
      component: () => (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Letzte Aktivitäten</CardTitle>
            <CardDescription>Übersicht deiner zuletzt generierten Dokumente.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Keine kürzlichen Aktivitäten. Generierte Dokumente werden hier erscheinen.
            </p>
          </CardContent>
        </Card>
      ),
      props: {},
      defaultActive: true,
      category: "activity"
    }
  ];

  const [activeWidgets, setActiveWidgets] = useState<string[]>(
    initialPreferences?.activeWidgets 
      ? [...new Set(initialPreferences.activeWidgets)] // Deduplicate server data
      : availableWidgets.filter(w => w.defaultActive).map(w => w.id)
  );
  const [widgetOrder, setWidgetOrder] = useState<string[]>(
    initialPreferences?.widgetOrder 
      ? [...new Set(initialPreferences.widgetOrder)] // Deduplicate server data
      : availableWidgets.map(w => w.id)
  );
  const [isLoading, setIsLoading] = useState(false);

  // Auto-add new widgets that aren't in existing preferences
  useEffect(() => {
    if (initialPreferences) {
      const allAvailableWidgetIds = availableWidgets.map(w => w.id);
      const currentActiveWidgets = initialPreferences.activeWidgets;
      const currentWidgetOrder = initialPreferences.widgetOrder;
      
      // Find new widgets that should be active by default but aren't in current preferences
      const newDefaultWidgets = availableWidgets
        .filter(w => w.defaultActive && !currentActiveWidgets.includes(w.id))
        .map(w => w.id);
      
      // Find new widgets that aren't in the current order
      const newOrderWidgets = allAvailableWidgetIds.filter(id => !currentWidgetOrder.includes(id));
      
      if (newDefaultWidgets.length > 0 || newOrderWidgets.length > 0) {
        console.log('🆕 Found new widgets to add:', { newDefaultWidgets, newOrderWidgets });
        
        // Update active widgets to include new default widgets (with deduplication)
        if (newDefaultWidgets.length > 0) {
          setActiveWidgets(prev => {
            const combined = [...prev, ...newDefaultWidgets];
            return [...new Set(combined)]; // Deduplicate
          });
        }
        
        // Update widget order to include new widgets (with deduplication)
        if (newOrderWidgets.length > 0) {
          setWidgetOrder(prev => {
            const combined = [...prev, ...newOrderWidgets];
            return [...new Set(combined)]; // Deduplicate
          });
        }
      }
    }
  }, [initialPreferences]);

  // Refs to track if this is the initial mount
  const isInitialMountRef = useRef(true);
  const hasInitializedRef = useRef(false);

  // Set initialization flag after initial preferences are loaded
  useEffect(() => {
    if (initialPreferences && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      // Small delay to ensure state has settled
      setTimeout(() => {
        isInitialMountRef.current = false;
      }, 100);
    }
  }, [initialPreferences]);

  // Save preferences to server when they change
  const savePreferences = async (newActiveWidgets?: string[], newWidgetOrder?: string[]) => {
    // Don't save on initial mount or if user isn't loaded yet
    if (isInitialMountRef.current || !hasInitializedRef.current) {
      console.log('🚫 Skipping save - initial mount or not initialized');
      return;
    }

    console.log('💾 Saving preferences...', { 
      activeWidgets: newActiveWidgets || activeWidgets, 
      widgetOrder: newWidgetOrder || widgetOrder 
    });

    try {
      setIsLoading(true);
      await fetch('/api/user-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activeWidgets: newActiveWidgets || activeWidgets,
          widgetOrder: newWidgetOrder || widgetOrder,
          themePreference: 'system' // TODO: Add theme management
        }),
      });
      console.log('✅ Preferences saved successfully');
    } catch (error) {
      console.error('❌ Failed to save preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save preferences when activeWidgets changes
  useEffect(() => {
    savePreferences(activeWidgets, undefined);
  }, [activeWidgets]);

  // Save preferences when widgetOrder changes  
  useEffect(() => {
    savePreferences(undefined, widgetOrder);
  }, [widgetOrder]);

  const toggleWidget = (widgetId: string) => {
    setActiveWidgets((prev) => {
      const newWidgets = prev.includes(widgetId) 
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId];
      return [...new Set(newWidgets)]; // Deduplicate just in case
    });
  };

  // Get ordered active widgets
  const orderedActiveWidgets = widgetOrder
    .filter(id => activeWidgets.includes(id))
    .map(id => availableWidgets.find(w => w.id === id))
    .filter(Boolean) as WidgetConfig[];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Willkommen zurück, {userName}!</h1>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Widgets
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Dashboard Widgets</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {availableWidgets.map((widget) => (
              <DropdownMenuItem
                key={widget.id}
                onClick={() => toggleWidget(widget.id)}
                className="flex items-center justify-between cursor-pointer"
              >
                <span>{widget.name}</span>
                {activeWidgets.includes(widget.id) ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-gray-400" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {orderedActiveWidgets.map((widget) => {
          const Component = widget.component;
          
          return (
            <div key={widget.id} className="break-inside-avoid mb-6">
              <Component {...widget.props} />
            </div>
          );
        })}
      </div>

      {orderedActiveWidgets.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Keine Widgets aktiv. Verwende den "Widgets" Button, um Widgets zu aktivieren.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 