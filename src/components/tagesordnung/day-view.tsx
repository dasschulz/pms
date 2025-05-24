'use client'

import React, { useState, useEffect } from 'react'
import { BundestagAgendaItem } from '@/lib/bundestag-api'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { format, isSameDay, parseISO, isToday, isFuture, isPast } from 'date-fns'
import { de } from 'date-fns/locale'
import { CalendarIcon, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AgendaDetailsModal } from './agenda-details-modal'

interface DayViewProps {
  selectedDate: Date
  agendaData: BundestagAgendaItem[]
  onDateChange: (date: Date) => void
}

export function DayView({ selectedDate, agendaData, onDateChange }: DayViewProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedAgendaItem, setSelectedAgendaItem] = useState<BundestagAgendaItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  const getEventsForDate = (date: Date) => {
    if (!agendaData) return []
    
    return agendaData.filter(item => {
      try {
        const itemDate = parseISO(item.start)
        return isSameDay(itemDate, date)
      } catch {
        return false
      }
    }).sort((a, b) => {
      try {
        const timeA = parseISO(a.start).getTime()
        const timeB = parseISO(b.start).getTime()
        return timeA - timeB
      } catch {
        return 0
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

  const formatFullDate = (date: Date) => {
    return format(date, 'EEEE, d. MMMM yyyy', { locale: de })
  }

  const getCurrentTimePosition = () => {
    if (!isToday(selectedDate)) return null
    
    const now = new Date()
    const berlinTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Berlin"}))
    const hours = berlinTime.getHours()
    const minutes = berlinTime.getMinutes()
    
    // Calculate position as percentage of the day (0-100%)
    const totalMinutes = hours * 60 + minutes
    const percentage = (totalMinutes / (24 * 60)) * 100
    
    return {
      percentage,
      time: format(berlinTime, 'HH:mm', { locale: de })
    }
  }

  const getStatusBadge = (status?: string) => {
    if (!status) return null
    
    const statusLower = status.toLowerCase()
    
    // Only show badges for 'angenommen', 'abgelehnt', and 'überwiesen'
    if (statusLower.includes('angenommen')) {
      return (
        <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-xs">
          <CheckCircle className="h-3 w-3 mr-1" />
          Angenommen
        </Badge>
      )
    }
    
    if (statusLower.includes('abgelehnt')) {
      return (
        <Badge className="bg-red-500/20 text-red-600 border-red-500/30 text-xs">
          <XCircle className="h-3 w-3 mr-1" />
          Abgelehnt
        </Badge>
      )
    }
    
    if (statusLower.includes('überweisung') || statusLower.includes('überwiesen')) {
      return (
        <Badge className="bg-gray-500/20 text-gray-600 border-gray-500/30 text-xs">
          Überwiesen
        </Badge>
      )
    }
    
    // Return null for any other status - no badge
    return null
  }

  const getEventBorderClass = (event: BundestagAgendaItem) => {
    const eventDate = parseISO(event.start)
    
    // Check if description contains "der Fraktion Die Linke"
    const isLinkeItem = event.description?.toLowerCase().includes('der fraktion die linke') || 
                        event.title?.toLowerCase().includes('der fraktion die linke')
    
    if (isLinkeItem) {
      if (isPast(eventDate)) {
        // Past Linke items: specific red color hsl(326 100% 22%)
        return "border-l-[hsl(326_100%_22%)] border-l-4"
      } else {
        // Future/current Linke items: regular red border
        return "border-l-red-500 border-l-4"
      }
    }
    
    // Future items: brighter border in dark mode, lighter in light mode
    if (isFuture(eventDate)) {
      return "border-l-border/80 dark:border-l-border/60 border-l-4"
    }
    
    // Past items: normal border
    return "border-l-border border-l-4"
  }

  const handleEventClick = (event: BundestagAgendaItem) => {
    setSelectedAgendaItem(event)
    setIsModalOpen(true)
  }

  const dayEvents = getEventsForDate(selectedDate)
  const currentTimePos = getCurrentTimePosition()

  const getEventPosition = (startTime: string, endTime?: string, index: number = 0, allEvents: BundestagAgendaItem[] = []) => {
    try {
      const start = parseISO(startTime)
      const startMinutes = start.getHours() * 60 + start.getMinutes()
      const startPercentage = (startMinutes / (24 * 60)) * 100
      
      let duration = 60 // Default 1 hour
      if (endTime) {
        const end = parseISO(endTime)
        const endMinutes = end.getHours() * 60 + end.getMinutes()
        duration = Math.max(30, endMinutes - startMinutes) // Minimum 30 minutes
      }
      
      // Calculate minimum height based on content
      const minHeightMinutes = 45 // Minimum 45 minutes for readability
      const actualDuration = Math.max(duration, minHeightMinutes)
      const durationPercentage = (actualDuration / (24 * 60)) * 100
      
      // Check for overlaps with previous events
      let adjustedTop = startPercentage
      const currentEventEnd = startPercentage + durationPercentage
      
      // Check if this event overlaps with any previous events
      for (let i = 0; i < index; i++) {
        const prevEvent = allEvents[i]
        try {
          const prevStart = parseISO(prevEvent.start)
          const prevStartMinutes = prevStart.getHours() * 60 + prevStart.getMinutes()
          const prevStartPercentage = (prevStartMinutes / (24 * 60)) * 100
          
          let prevDuration = 60
          if (prevEvent.end) {
            const prevEnd = parseISO(prevEvent.end)
            const prevEndMinutes = prevEnd.getHours() * 60 + prevEnd.getMinutes()
            prevDuration = Math.max(30, prevEndMinutes - prevStartMinutes)
          }
          const prevActualDuration = Math.max(prevDuration, minHeightMinutes)
          const prevDurationPercentage = (prevActualDuration / (24 * 60)) * 100
          const prevEventEnd = prevStartPercentage + prevDurationPercentage
          
          // If there's an overlap, adjust the position
          if (adjustedTop < prevEventEnd && adjustedTop + durationPercentage > prevStartPercentage) {
            adjustedTop = Math.max(adjustedTop, prevEventEnd + 0.5) // Add small gap
          }
        } catch {
          // Skip if can't parse previous event
        }
      }
      
      return {
        top: `${adjustedTop}%`,
        height: `${Math.max(durationPercentage, 6)}%` // Minimum 6% height for visibility
      }
    } catch {
      return {
        top: `${index * 8}%`, // Fallback: space events vertically
        height: '6%'
      }
    }
  }

  // Dynamic height calculation based on events with better spacing
  const calculateTimelineHeight = () => {
    if (dayEvents.length === 0) return 800
    
    // Calculate the end time of the last event to determine timeline height
    let lastEventTime = dayEvents.reduce((latest, event) => {
      try {
        const eventEnd = event.end ? parseISO(event.end) : parseISO(event.start)
        const eventHour = eventEnd.getHours()
        return Math.max(latest, eventHour + 3) // Add 3 hours buffer
      } catch {
        return latest
      }
    }, 8) // Minimum 8 AM start
    
    // Account for potential overlapping adjustments
    const eventsWithPotentialOverlaps = dayEvents.length > 3
    if (eventsWithPotentialOverlaps) {
      lastEventTime += Math.ceil(dayEvents.length / 3) // Add extra space for overlaps
    }
    
    const minHeight = Math.max(lastEventTime * 60, 800) // 60px per hour, minimum 800px
    return Math.min(minHeight, 1800) // Maximum 1800px
  }

  const timelineHeight = calculateTimelineHeight()

  return (
    <div className="p-4">
      {/* Day Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{formatFullDate(selectedDate)}</h2>
          {isToday(selectedDate) && currentTimePos && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Clock className="h-4 w-4" />
              Aktuelle Zeit: {currentTimePos.time}
            </div>
          )}
        </div>
        
        {/* Date Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Datum wählen
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onDateChange(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Day Timeline */}
      <div className="relative max-h-[70vh] overflow-y-auto border rounded-lg bg-background">
        {/* Time Grid */}
        <div className="relative bg-background" style={{ height: `${timelineHeight}px` }}>
          {/* Hour lines and labels */}
          {Array.from({ length: 24 }, (_, hour) => (
            <div
              key={hour}
              className="absolute left-0 right-0 border-t border-border/30"
              style={{ top: `${(hour / 24) * 100}%` }}
            >
              <div className="absolute left-2 -top-2 text-xs text-muted-foreground bg-background px-1 min-w-[3rem]">
                {hour.toString().padStart(2, '0')}:00
              </div>
            </div>
          ))}
          
          {/* Current Time Indicator */}
          {currentTimePos && (
            <div
              className="absolute left-0 right-0 z-20"
              style={{ top: currentTimePos.percentage + '%' }}
            >
              <div className="h-0.5 bg-red-500 relative">
                <div className="absolute left-2 -top-1 w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="absolute left-8 -top-2 text-xs text-red-500 font-medium bg-background px-1">
                  {currentTimePos.time}
                </div>
              </div>
            </div>
          )}
          
          {/* Events */}
          <div className="absolute left-20 right-4 top-0 bottom-0">
            {dayEvents.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Keine Termine für diesen Tag</p>
                </div>
              </div>
            ) : (
              dayEvents.map((event, index) => {
                const position = getEventPosition(event.start, event.end, index, dayEvents)
                
                return (
                  <Card
                    key={index}
                    className={cn(
                      "absolute left-0 right-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer z-10",
                      getEventBorderClass(event)
                    )}
                    style={position}
                    onClick={() => handleEventClick(event)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm leading-tight line-clamp-2">
                          {event.title}
                        </CardTitle>
                        {getStatusBadge(event.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-1">
                        {event.start && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(event.start)}
                            {event.end && ` - ${formatTime(event.end)}`}
                          </div>
                        )}
                        
                        {event.top && (
                          <div className="text-xs text-muted-foreground">
                            TOP: {event.top}
                          </div>
                        )}
                        
                        {event.description && (
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {event.description}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Day Summary */}
      {dayEvents.length > 0 && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <div className="text-sm text-muted-foreground">
            <strong>{dayEvents.length}</strong> Termine am {formatFullDate(selectedDate)}
          </div>
        </div>
      )}

      <AgendaDetailsModal 
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        agendaItem={selectedAgendaItem}
      />
    </div>
  )
} 