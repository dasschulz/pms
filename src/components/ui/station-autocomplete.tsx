"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Train, MapPin, X, Check } from 'lucide-react';

interface Station {
  id: string;
  name: string;
  type: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  products?: {
    nationalExpress?: boolean;
    national?: boolean;
    regionalExp?: boolean;
    regional?: boolean;
  };
}

interface StationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  label?: string;
}

export function StationAutocomplete({
  value,
  onChange,
  placeholder = "Station suchen...",
  id,
  className,
  label
}: StationAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isValidStation, setIsValidStation] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout>();
  const validationTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Debounced search function
  const searchStations = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/stations/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const stations: Station[] = await response.json();
        setSuggestions(stations);
        setIsOpen(stations.length > 0);
      }
    } catch (error) {
      console.error('Station search failed:', error);
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change with debouncing
  const handleInputChange = (newValue: string) => {
    setQuery(newValue);
    setSelectedIndex(-1);
    setIsValidStation(false);
    setShowValidation(true); // Show validation while typing
    setLastActivityTime(Date.now());

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced search
    timeoutRef.current = setTimeout(() => {
      searchStations(newValue);
    }, 300);
  };

  // Handle station selection
  const selectStation = (station: Station) => {
    console.log('🚉 StationAutocomplete: Selected station:', station);
    console.log('🚉 StationAutocomplete: Station name to save:', station.name);
    setQuery(station.name);
    onChange(station.name);
    setIsValidStation(true);
    setShowValidation(true);
    setIsOpen(false);
    setSuggestions([]);
    setSelectedIndex(-1);
    setLastActivityTime(Date.now());
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          selectStation(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        listRef.current &&
        !listRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Validate current value
  useEffect(() => {
    const isValid = suggestions.some(station => station.name === query) || 
                   (value === query && value.length > 0);
    setIsValidStation(isValid);
    
    // Only show validation if there's user activity or the field has invalid input
    if (!isValid && query.length > 0) {
      setShowValidation(true); // Always show negative validation
    }
  }, [query, suggestions, value]);

  // Sync with external value changes and reset validation display on page load
  useEffect(() => {
    if (value !== query) {
      setQuery(value);
    }
    // Reset validation display on component mount/value change from parent
    setShowValidation(false);
  }, [value]);

  // Track activity on focus and input events
  const handleFocus = () => {
    setLastActivityTime(Date.now());
    if (query.length >= 2 && suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  const handleKeyDownWithActivity = (e: React.KeyboardEvent) => {
    setLastActivityTime(Date.now());
    handleKeyDown(e);
  };

  // Auto-hide positive validation after 2 seconds of inactivity
  useEffect(() => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    if (isValidStation && showValidation) {
      validationTimeoutRef.current = setTimeout(() => {
        setShowValidation(false);
      }, 2000);
    }

    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [lastActivityTime, isValidStation, showValidation]);

  // Get train type badges for a station
  const getTrainTypes = (products?: Station['products']) => {
    if (!products) return [];
    const types = [];
    if (products.nationalExpress) types.push('ICE');
    if (products.national) types.push('IC/EC');
    if (products.regionalExp) types.push('RE');
    if (products.regional) types.push('RB');
    return types;
  };

  // Custom validation colors
  const validColor = 'hsl(173, 100%, 35%)';
  const invalidColor = 'hsl(0, 100%, 50%)';

  return (
    <div className={`relative ${className}`}>
      {label && (
        <Label htmlFor={id} className="flex items-center space-x-2 mb-2">
          <Train className="w-4 h-4" />
          <span>{label}</span>
        </Label>
      )}
      
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDownWithActivity}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="pr-10"
          style={{
            ...(query.length > 0 && showValidation && {
              borderColor: isValidStation ? validColor : invalidColor,
            }),
          }}
          autoComplete="off"
        />
        
        {/* Status indicator */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          ) : query.length > 0 && showValidation ? (
            isValidStation ? (
              <Check className="w-4 h-4" style={{ color: validColor }} />
            ) : (
              <X className="w-4 h-4" style={{ color: invalidColor }} />
            )
          ) : null}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto z-50"
        >
          {suggestions.map((station, index) => (
            <li
              key={station.id}
              onClick={() => selectStation(station)}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                index === selectedIndex 
                  ? 'bg-blue-50 dark:bg-blue-900/20' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="font-medium text-sm">{station.name}</div>
                    {station.location && (
                      <div className="text-xs text-gray-500">
                        {station.location.latitude.toFixed(4)}, {station.location.longitude.toFixed(4)}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Train type badges */}
                <div className="flex items-center space-x-1">
                  {getTrainTypes(station.products).slice(0, 3).map((type, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Validation message */}
      {query.length > 0 && !isValidStation && !isLoading && showValidation && (
        <p className="text-xs mt-1" style={{ color: invalidColor }}>
          Bitte wähle eine gültige Station aus der Liste aus
        </p>
      )}
      
      {query.length > 0 && isValidStation && showValidation && (
        <p className="text-xs mt-1" style={{ color: validColor }}>
          ✓ Gültige Station ausgewählt
        </p>
      )}
    </div>
  );
} 