"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Checkbox } from "@/components/ui/checkbox";
// import { DatePicker } from "@/components/ui/date-picker"; // Assuming a date picker component exists

interface MdbDetails {
  name: string;
  wahlkreis: string;
  // Add other MdB details if needed
}

interface TripDetails {
  // Add trip specific details if needed, e.g., trip date, description
  // For now, we assume the form is generic enough or details are part of MdbDetails
}

export default function BpaFormPage() {
  const params = useParams();
  const token = params.token as string;

  const [mdbDetails, setMdbDetails] = useState<MdbDetails | null>(null);
  const [tripDetails, setTripDetails] = useState<TripDetails | null>(null); // Placeholder for trip-specific data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    vorname: '',
    nachname: '',
    geburtsdatum: '', // Consider using a Date object or ISO string
    email: '',
    anschrift: '',
    postleitzahl: '',
    ort: '',
    parteimitglied: false,
    zustieg: '',
    essenspraeferenz: '',
    // Add other fields from BPA_Formular as needed
  });

  useEffect(() => {
    if (token) {
      const fetchFormDetails = async () => {
        setLoading(true);
        try {
          // TODO: Replace with actual API call to fetch MdB and trip details by token
          // This API endpoint would also validate the token
          // const response = await fetch(`/api/bpa-form-details?token=${token}`);
          // if (!response.ok) {
          //   throw new Error('Fehler beim Laden der Formulardaten.');
          // }
          // const data = await response.json();
          // setMdbDetails(data.mdbDetails);
          // setTripDetails(data.tripDetails); // If there are trip specific details to display

          // Mock data for now:
          await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
          setMdbDetails({
            name: 'Dr. Max Mustermann',
            wahlkreis: 'WK 123 Berlin-Mitte',
          });
          // setTripDetails({}); // Set mock trip details if any

          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten.');
          setMdbDetails(null);
          setTripDetails(null);
        }
        setLoading(false);
      };
      fetchFormDetails();
    }
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // Need to handle checkbox type explicitly for boolean conversion
    const isCheckbox = type === 'checkbox';
    setFormData(prev => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // const handleDateChange = (date: Date | undefined, fieldName: string) => {
  //   setFormData(prev => ({
  //     ...prev,
  //     [fieldName]: date ? date.toISOString().split('T')[0] : '', // Store as YYYY-MM-DD
  //   }));
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission to an API endpoint
    // This endpoint would save the data to the BPA_Formular table in Supabase
    // linking it to the MdB (UserID) and the specific Fahrt (FahrtID) via the token.
    console.log('Form submitted:', formData);
    alert('Anmeldung gesendet! (Placeholder)');
  };

  if (loading) {
    return <div className="container mx-auto py-10 text-center">Daten werden geladen...</div>;
  }

  if (error) {
    return <div className="container mx-auto py-10 text-center text-red-500">Fehler: {error}</div>;
  }

  if (!mdbDetails) {
    return <div className="container mx-auto py-10 text-center">Ungültiger oder abgelaufener Link.</div>;
  }

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Anmeldung zur BPA-Fahrt</h1>
          <p className="mt-2 text-lg text-gray-600">
            Eine Einladung von {mdbDetails.name} (MdB, {mdbDetails.wahlkreis})
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 shadow-lg rounded-lg">
          <div>
            <label htmlFor="vorname" className="block text-sm font-medium text-gray-700">Vorname</label>
            <input type="text" name="vorname" id="vorname" value={formData.vorname} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>

          <div>
            <label htmlFor="nachname" className="block text-sm font-medium text-gray-700">Nachname</label>
            <input type="text" name="nachname" id="nachname" value={formData.nachname} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          
          <div>
            <label htmlFor="geburtsdatum" className="block text-sm font-medium text-gray-700">Geburtsdatum</label>
            {/* Replace with actual DatePicker component */}
            <input type="date" name="geburtsdatum" id="geburtsdatum" value={formData.geburtsdatum} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-Mail-Adresse</label>
            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>

          <div>
            <label htmlFor="anschrift" className="block text-sm font-medium text-gray-700">Anschrift (Straße, Hausnummer)</label>
            <input type="text" name="anschrift" id="anschrift" value={formData.anschrift} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          
          <div>
            <label htmlFor="postleitzahl" className="block text-sm font-medium text-gray-700">Postleitzahl</label>
            <input type="text" name="postleitzahl" id="postleitzahl" value={formData.postleitzahl} onChange={handleChange} required pattern="[0-9]{5}" title="Bitte geben Sie eine 5-stellige Postleitzahl ein." className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>

          <div>
            <label htmlFor="ort" className="block text-sm font-medium text-gray-700">Ort</label>
            <input type="text" name="ort" id="ort" value={formData.ort} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          
          <div>
            <label htmlFor="zustieg" className="block text-sm font-medium text-gray-700">Zustiegspunkt</label>
            {/* TODO: Populate options dynamically based on trip details / MdB config */}
            <select name="zustieg" id="zustieg" value={formData.zustieg} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <option value="" disabled>Bitte auswählen...</option>
              <option value="Osnabrück">Osnabrück</option>
              <option value="Hannover">Hannover</option>
              <option value="Berlin">Berlin</option>
            </select>
          </div>

          <div>
            <label htmlFor="essenspraeferenz" className="block text-sm font-medium text-gray-700">Essenspräferenz</label>
            <select name="essenspraeferenz" id="essenspraeferenz" value={formData.essenspraeferenz} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <option value="" disabled>Bitte auswählen...</option>
              <option value="Alles">Alles</option>
              <option value="Vegetarisch">Vegetarisch</option>
              <option value="Vegan">Vegan</option>
              <option value="Kosher">Kosher</option>
              <option value="Halal">Halal</option>
            </select>
          </div>

          <div className="flex items-center">
            <input id="parteimitglied" name="parteimitglied" type="checkbox" checked={formData.parteimitglied} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
            <label htmlFor="parteimitglied" className="ml-2 block text-sm text-gray-900">Ich bin Parteimitglied</label>
          </div>

          {/* Add more fields as per BPA_Formular schema: Geburtsort, Themen, Teilnahme_5J, Einzelzimmer etc. if they are meant for the public form */}
          {/* For 'Teilnahme_5J', this is likely something to be checked by the MdB's office, not self-declared or at least needs clarification */}
          {/* 'Einzelzimmer' might be an option if applicable */}

          <div className="pt-2">
            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Anmeldung Absenden
            </button>
          </div>

          <div className="mt-6">
            <p className="text-xs text-gray-500">
              Hinweis: Für die Fahrten erhalten die Teilnehmer einen Fahrtkostenzuschuss. In Sitzungswochen ist der Besuch einer Plenardebatte, in der sitzungsfreien Zeit ein Vortrag im Plenarsaal über die Aufgaben und Funktionen des Parlaments sowie ein Museums- oder Ministerienbesuch vorgesehen. Wenn terminlich möglich, wird ein Treffen mit {mdbDetails.name} organisiert. Die Teilnehmer müssen in der Regel das 18. Lebensjahr vollendet haben. Eingeladen werden können deutsche Staatsangehörige und ausländische Teilnehmer aus den EU-Staaten. Nach den zurzeit geltenden Bestimmungen muss es sich bei den Teilnehmern um "politisch Interessierte" aus den jeweiligen Wahlkreisen handeln. Eine mehrmalige Teilnahme derselben Person innerhalb von 5 Jahren entspricht nicht den Richtlinien des BPA. Zudem besteht die Möglichkeit zu einem kostenlosen Mittagessen im Besucherrestaurant des Bundestags.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
} 