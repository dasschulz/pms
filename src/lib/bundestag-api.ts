export interface BundestagAgendaItem {
  id: string
  title: string
  start: string
  end: string
  description?: string
  top?: string
  type?: string
  status?: string
  url?: string
  namentliche_abstimmung?: boolean
}

export interface BundestagWeekData {
  year: number
  week: number
  items: BundestagAgendaItem[]
}

const BT_TO_API_BASE = 'https://api.hutt.io/bt-to'

export class BundestagAPI {
  /**
   * Fetch agenda data for a specific year and week
   */
  async fetchAgenda(): Promise<BundestagAgendaItem[]> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/bundestag`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data.map((item: any) => ({
        id: item.uid,
        title: item.thema,
        description: item.beschreibung,
        start: item.start,
        end: item.end,
        top: item.top,
        type: 'agenda',
        status: item.status,
        url: item.url,
        namentliche_abstimmung: item.namentliche_abstimmung
      }));
    } catch (error) {
      console.error('Error fetching Bundestag agenda:', error);
      throw error;
    }
  }

  /**
   * Get current week number and year
   */
  static getCurrentWeek(): { year: number, week: number } {
    const now = new Date()
    // Berlin timezone (GMT+1)
    const berlinTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Berlin"}))
    
    return this.getCurrentWeekForDate(berlinTime)
  }

  /**
   * Get week number and year for a specific date
   */
  static getCurrentWeekForDate(date: Date): { year: number, week: number } {
    const year = date.getFullYear()
    const start = new Date(year, 0, 1)
    const days = Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
    const week = Math.ceil((days + start.getDay() + 1) / 7)
    
    return { year, week }
  }

  /**
   * Transform API response to our internal format
   */
  private static transformApiResponse(data: any): BundestagWeekData {
    if (!data || !data.items) {
      return {
        year: new Date().getFullYear(),
        week: this.getCurrentWeek().week,
        items: []
      }
    }

    const items = Array.isArray(data.items) ? data.items : []
    
    return {
      year: data.year || new Date().getFullYear(),
      week: data.week || this.getCurrentWeek().week,
      items: items.map((item: any) => ({
        id: item.id || Math.random().toString(36).substr(2, 9),
        title: item.title || item.summary || 'Unbekannter Tagesordnungspunkt',
        start: item.start || item.dtstart,
        end: item.end || item.dtend,
        description: item.description,
        top: item.top,
        type: item.type || 'agenda'
      }))
    }
  }
} 