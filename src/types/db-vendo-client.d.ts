declare module 'db-vendo-client' {
  interface ClientOptions {
    profile: string;
    userAgent: string;
  }
  
  interface Location {
    id: string;
    name: string;
    type?: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  }
  
  interface Journey {
    legs: Array<{
      departure: string;
      arrival: string;
      departureDelay?: number;
      line?: {
        product?: {
          short?: string;
        };
        name?: string;
      };
    }>;
    duration: number;
  }
  
  interface Client {
    locations(query: string, options?: any): Promise<Location[]>;
    journeys(from: string, to: string, options?: any): Promise<{ journeys: Journey[] }>;
  }
  
  export function createClient(profile: any, userAgent: string): Client;
  export function loadEnrichedStationData(): any;
}

declare module 'db-vendo-client/p/dbnav/index.js' {
  export const profile: any;
} 