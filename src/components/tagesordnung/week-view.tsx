'use client'

import React, { useState } from 'react'
import { BundestagAgendaItem } from '@/lib/bundestag-api'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { format, startOfWeek, addDays, isSameDay, parseISO, isToday, isFuture, isPast } from 'date-fns'
import { de } from 'date-fns/locale'
import { CheckCircle, XCircle } from 'lucide-react'
import { AgendaDetailsModal } from './agenda-details-modal'

interface WeekViewProps {
  currentWeek: { year: number; week: number }
  agendaData: BundestagAgendaItem[]
  onDateSelect: (date: Date) => void
}

export function WeekView({ currentWeek, agendaData, onDateSelect }: WeekViewProps) {
  const [selectedAgendaItem, setSelectedAgendaItem] = useState<BundestagAgendaItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Get the start of the week for the current week
  const getWeekStart = (year: number, week: number) => {
    const firstDayOfYear = new Date(year, 0, 1)
    const daysToAdd = (week - 1) * 7
    const weekStart = addDays(firstDayOfYear, daysToAdd)
    return startOfWeek(weekStart, { weekStartsOn: 1 }) // Monday start
  }

  const weekStartDate = getWeekStart(currentWeek.year, currentWeek.week)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i))

  const getEventsForDate = (date: Date) => {
    if (!agendaData) return []
    
    return agendaData.filter(item => {
      try {
        const itemDate = parseISO(item.start)
        return isSameDay(itemDate, date)
      } catch {
        return false
      }
    })
  }

  const formatTime = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      return format(date, 'HH:mm', { locale: de })
    } catch {
      return ''
    }
  }

  const getStatusBadge = (status?: string) => {
    if (!status) return null
    
    const statusLower = status.toLowerCase()
    
    // Only show badges for 'angenommen', 'abgelehnt', and 'überwiesen'
    if (statusLower.includes('angenommen')) {
      return (
        <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-[10px] px-1 py-0 h-4">
          <CheckCircle className="h-2 w-2 mr-1" />
          Angenommen
        </Badge>
      )
    }
    
    if (statusLower.includes('abgelehnt')) {
      return (
        <Badge className="bg-red-500/20 text-red-600 border-red-500/30 text-[10px] px-1 py-0 h-4">
          <XCircle className="h-2 w-2 mr-1" />
          Abgelehnt
        </Badge>
      )
    }
    
    if (statusLower.includes('überweisung') || statusLower.includes('überwiesen')) {
      return (
        <Badge className="bg-gray-500/20 text-gray-600 dark:text-gray-300 border-gray-500/30 text-[10px] px-1 py-0 h-4">
          Überwiesen
        </Badge>
      )
    }
    
    // Return null for any other status - no badge
    return null
  }

  const getEventBorderClass = (event: BundestagAgendaItem) => {
    const eventDate = parseISO(event.start)
    const now = new Date()
    
    // Check if description contains "der Fraktion Die Linke"
    const isLinkeItem = event.description?.toLowerCase().includes('der fraktion die linke') || 
                        event.title?.toLowerCase().includes('der fraktion die linke')
    
    if (isLinkeItem) {
      if (isPast(eventDate)) {
        // Past Linke items: specific red color hsl(326 100% 22%)
        return "border-[hsl(326_100%_22%)]"
      } else {
        // Future/current Linke items: regular red border
        return "border-red-500"
      }
    }
    
    // Future items: brighter border in dark mode, lighter in light mode
    if (isFuture(eventDate)) {
      return "border-border/80 dark:border-border/60"
    }
    
    // Past items: normal border
    return "border-border"
  }

  const handleEventClick = (event: BundestagAgendaItem) => {
    setSelectedAgendaItem(event)
    setIsModalOpen(true)
  }

  return (
    <div className="p-4">
      {/* Week Header */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className={cn(
              "text-center p-3 rounded-lg border cursor-pointer transition-colors group",
              isToday(day) 
                ? "bg-primary text-primary-foreground border-primary" 
                : "hover:bg-[hsl(0,100%,50%)] border-border"
            )}
            onClick={() => onDateSelect(day)}
          >
            <div className={cn(
              "text-sm font-medium",
              isToday(day) ? "text-primary-foreground" : "text-foreground group-hover:text-white"
            )}>
              {format(day, 'EEEE', { locale: de })}
            </div>
            <div className={cn(
              "text-lg font-bold",
              isToday(day) ? "text-primary-foreground" : "text-foreground group-hover:text-white"
            )}>
              {format(day, 'd', { locale: de })}
            </div>
            <div className={cn(
              "text-xs",
              isToday(day) ? "text-primary-foreground" : "text-muted-foreground group-hover:text-white"
            )}>
              {format(day, 'MMM', { locale: de })}
            </div>
          </div>
        ))}
      </div>

      {/* Week Grid with Events */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, dayIndex) => {
          const dayEvents = getEventsForDate(day)
          
          return (
            <div
              key={dayIndex}
              className={cn(
                "min-h-[200px] p-2 border rounded-lg",
                isToday(day) ? "border-primary/50 bg-primary/5" : "border-border"
              )}
            >
              {/* Day Events */}
              <div className="space-y-1">
                {dayEvents.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    Keine Termine
                  </div>
                ) : (
                  dayEvents.map((event, eventIndex) => (
                    <div
                      key={eventIndex}
                      className={cn(
                        "bg-card border rounded p-2 text-xs hover:shadow-sm hover:border-[hsl(173,100%,35%)] transition-all cursor-pointer",
                        getEventBorderClass(event)
                      )}
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="space-y-1 mb-1">
                        {getStatusBadge(event.status) && (
                          <div className="flex justify-start">
                            {getStatusBadge(event.status)}
                          </div>
                        )}
                        <div className="font-medium text-xs leading-tight">
                          {event.title}
                        </div>
                      </div>
                      
                      {event.start && (
                        <div className="text-[10px] text-muted-foreground">
                          {formatTime(event.start)}
                          {event.end && ` - ${formatTime(event.end)}`}
                        </div>
                      )}
                      
                      {event.top && (
                        <div className="text-[10px] text-muted-foreground mt-1">
                          TOP: {event.top}
                        </div>
                      )}
                      
                      {event.description && (
                        <div className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                          {event.description}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      <AgendaDetailsModal 
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        agendaItem={selectedAgendaItem}
      />
    </div>
  )
} 