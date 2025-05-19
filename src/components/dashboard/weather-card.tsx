
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun, Cloud, Zap, CloudRain, CloudSnow } from "lucide-react";
import { useState, useEffect } from "react";

interface WeatherCardProps {
  city: string;
  electoralDistrict?: string;
}

// Simplified weather data structure
interface WeatherData {
  temp: number;
  description: string;
  icon: React.ElementType;
}

export function WeatherCard({ city, electoralDistrict }: WeatherCardProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [districtWeather, setDistrictWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    // Placeholder: Simulate API call
    // In a real app, you'd fetch this from a weather API
    const fetchWeather = (location: string) => {
      // Simulate different weather for different locations for demo
      let temp, description, Icon;
      const random = Math.random();
      if (location.toLowerCase().includes("berlin")) {
        if (random < 0.33) { temp = 18; description = "Sonnig"; Icon = Sun; } // Sunny
        else if (random < 0.66) { temp = 15; description = "Bewölkt"; Icon = Cloud; } // Cloudy
        else { temp = 12; description = "Regnerisch"; Icon = CloudRain; } // Rainy
      } else { // For electoral district
        if (random < 0.25) { temp = 20; description = "Überwiegend Sonnig"; Icon = Sun; } // Mostly Sunny
        else if (random < 0.5) { temp = 16; description = "Teilweise Bewölkt"; Icon = Cloud; } // Partly Cloudy
        else if (random < 0.75) { temp = 10; description = "Schauer"; Icon = CloudRain; } // Showers
        else { temp = 5; description = "Schneeschauer"; Icon = CloudSnow; } // Snow Showers
      }
      return { temp, description, icon: Icon };
    };
    
    setWeather(fetchWeather(city));
    if (electoralDistrict) {
      setDistrictWeather(fetchWeather(electoralDistrict));
    }
  }, [city, electoralDistrict]);

  const renderWeatherInfo = (locationName: string, data: WeatherData | null) => {
    if (!data) {
      return <p className="text-sm text-muted-foreground">Lade Wetter für {locationName}...</p>;
    }
    const IconComponent = data.icon;
    return (
      <div className="flex items-center space-x-4">
        <IconComponent className="w-10 h-10 text-primary" />
        <div>
          <p className="text-lg font-semibold">{locationName}</p>
          <p className="text-2xl font-bold">{data.temp}°C</p>
          <p className="text-sm text-muted-foreground">{data.description}</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Wetterübersicht</CardTitle>
        <CardDescription>Aktuelle Bedingungen an wichtigen Standorten.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderWeatherInfo(city, weather)}
        {electoralDistrict && districtWeather && renderWeatherInfo(electoralDistrict, districtWeather)}
      </CardContent>
    </Card>
  );
}

    