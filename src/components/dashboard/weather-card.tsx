"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun, Cloud, Zap, CloudRain, CloudSnow, HelpCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface WeatherCardProps {
  city: string;
  electoralDistrict?: string;
}

interface UserDetails {
  wahlkreis?: string;
  plz?: string;
}

// Simplified weather data structure
interface WeatherData {
  temp: number;
  description: string;
  icon: React.ElementType;
}

export function WeatherCard({ city, electoralDistrict }: WeatherCardProps) {
  const [berlinWeather, setBerlinWeather] = useState<WeatherData | null>(null);
  const [districtWeather, setDistrictWeather] = useState<WeatherData | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoadingUserDetails, setIsLoadingUserDetails] = useState(true);
  const [errorUserDetails, setErrorUserDetails] = useState<string | null>(null);

  useEffect(() => {
    // Fetch user details (Wahlkreis and PLZ)
    const fetchUserDetails = async () => {
      setIsLoadingUserDetails(true);
      setErrorUserDetails(null);
      try {
        const response = await fetch('/api/user-details');
        if (!response.ok) {
          throw new Error(`Failed to fetch user details: ${response.statusText}`);
        }
        const data: UserDetails = await response.json();
        setUserDetails(data);
      } catch (error) {
        console.error("Error fetching user details:", error);
        setErrorUserDetails(error instanceof Error ? error.message : 'Unknown error fetching user details');
      }
      setIsLoadingUserDetails(false);
    };

    fetchUserDetails();
  }, []);

  useEffect(() => {
    const berlinPostalCode = "10117"; // Specific postal code for Berlin (Bundestag)

    // Renamed and refactored to differentiate simulation types
    const simulateFetchWeatherForType = (plz: string, type: 'berlin' | 'other') => {
      let temp, description, Icon;
      const random = Math.random();

      if (type === 'berlin') { // Weather simulation pattern for Berlin (Bundestag)
        if (random < 0.33) { temp = 18; description = "Sonnig"; Icon = Sun; }
        else if (random < 0.66) { temp = 15; description = "Bewölkt"; Icon = Cloud; }
        else { temp = 12; description = "Regnerisch"; Icon = CloudRain; }
      } else { // Weather simulation pattern for Wahlkreis (or any other PLZ)
        if (random < 0.25) { temp = 20; description = "Überwiegend Sonnig"; Icon = Sun; }
        else if (random < 0.5) { temp = 16; description = "Teilweise Bewölkt"; Icon = Cloud; }
        else if (random < 0.75) { temp = 10; description = "Schauer"; Icon = CloudRain; }
        else { temp = 5; description = "Schneeschauer"; Icon = CloudSnow; }
      }
      return { temp, description, icon: Icon };
    };

    // Fetch/simulate Berlin weather using its specific PLZ and type
    setBerlinWeather(simulateFetchWeatherForType(berlinPostalCode, 'berlin'));

    // Fetch/simulate district weather if user details (including PLZ) are available
    if (userDetails?.plz && userDetails?.wahlkreis) {
      setDistrictWeather(simulateFetchWeatherForType(userDetails.plz, 'other'));
    }
    // If userDetails.plz is not available, districtWeather will remain null, handled by renderWeatherInfo
  }, [city, userDetails]); // Depends on city and userDetails to keep deps array size constant

  const renderWeatherInfo = (locationName: string, data: WeatherData | null, isLoading?: boolean, error?: string | null) => {
    if (isLoading) {
      return <p className="text-sm text-muted-foreground">Lade Wetter für {locationName}...</p>;
    }
    if (error) {
       return (
        <div className="flex items-center space-x-2 text-sm text-destructive">
          <HelpCircle className="w-5 h-5" />
          <span>Fehler beim Laden der Wetterdaten für {locationName}.</span>
        </div>
      );
    }
    if (!data) {
      // This case might occur if userDetails are loaded but PLZ is missing for the district weather
      return <p className="text-sm text-muted-foreground">Wetterdaten für {locationName} nicht verfügbar.</p>;
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
        <CardTitle className="flex items-center space-x-2">
          <Sun className="w-5 h-5" />
          <span>Wetterübersicht</span>
        </CardTitle>
        <CardDescription>Aktuelle Bedingungen an wichtigen Standorten.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Display Berlin weather with new name and data based on 10117 */}
        {renderWeatherInfo(`${city} (Bundestag)`, berlinWeather)}
        {isLoadingUserDetails && renderWeatherInfo("Wahlkreis", null, true)}
        {!isLoadingUserDetails && errorUserDetails && renderWeatherInfo(userDetails?.wahlkreis || "Wahlkreis", null, false, errorUserDetails)}
        {!isLoadingUserDetails && !errorUserDetails && userDetails?.wahlkreis && 
          renderWeatherInfo(userDetails.wahlkreis, districtWeather, false, !districtWeather && !userDetails.plz ? "PLZ nicht gefunden" : null)}
        {!isLoadingUserDetails && !errorUserDetails && !userDetails?.wahlkreis && 
          renderWeatherInfo("Wahlkreis", null, false, "Wahlkreis nicht gefunden")}
      </CardContent>
    </Card>
  );
}

    