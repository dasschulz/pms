'use client'

import React, { useState, useEffect, useRef } from 'react'
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

// Helper to estimate content height for a card (more conservative, no description)
const estimateContentHeight = (event: BundestagAgendaItem): number => {
  let height = 30 // Base padding and line heights
  if (event.title) {
    height += Math.ceil(event.title.length / 35) * 16 // Approx 16px per line (35 chars/line)
  }
  if (event.start || event.top || event.status) {
    height += 18 // For the combined info line
  }
  // Removed description from height calculation
  return Math.max(height, 50) // Minimum content height of 50px (reduced)
}

export function DayView({ selectedDate, agendaData, onDateChange }: DayViewProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedAgendaItem, setSelectedAgendaItem] = useState<BundestagAgendaItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [initialScrollDone, setInitialScrollDone] = useState(false);
  const eventCardRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

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

  const handleEventClick = (event: BundestagAgendaItem) => {
    setSelectedAgendaItem(event)
    setIsModalOpen(true)
  }

  const calculateLayoutParameters = (events: BundestagAgendaItem[]) => {
    if (events.length === 0) {
      return {
        eventPositions: [],
        pixelsPerHour: 80,
        uniformCardHeight: 60, // Still calculated but cards render with position.height for now
        timelineHeight: 24 * 80,
      }
    }

    let shortestDurationHours = Infinity
    let maxContentHeight = 0

    for (const event of events) {
      try {
        const start = parseISO(event.start)
        let duration = 0.5
        if (event.end) {
          const end = parseISO(event.end)
          if (start && !isNaN(start.getTime()) && end && !isNaN(end.getTime())) {
            const startHour = start.getHours() + start.getMinutes() / 60
            const endHour = end.getHours() + end.getMinutes() / 60
            if (endHour > startHour) duration = Math.max(0.5, endHour - startHour)
          }
        }
        shortestDurationHours = Math.min(shortestDurationHours, duration)
        const contentHeight = estimateContentHeight(event)
        maxContentHeight = Math.max(maxContentHeight, contentHeight)
      } catch { /* skip */ }
    }

    const uniformCardHeight = Math.max(maxContentHeight, 50)
    if (shortestDurationHours === Infinity) shortestDurationHours = 0.5
    const minVisualHeightForShortestEvent = 60
    let calculatedPph = minVisualHeightForShortestEvent / shortestDurationHours
    const pixelsPerHour = Math.max(60, Math.min(calculatedPph, 180))

    const positions: Array<{
      top: number // Store as number for easier calculations
      height: number // Store as number
      left: number // Proportion 0.0 to 1.0
      width: number // Proportion 0.0 to 1.0
      event: BundestagAgendaItem
    }> = []

    const sortedEvents = [...events].sort((a, b) => {
      try {
        return parseISO(a.start).getTime() - parseISO(b.start).getTime()
      } catch {
        return 0
      }
    })
    const occupiedSlots: Array<{ start: number; end: number }> = [] // Tracks vertical occupation
    const EVENT_GAP = 8

    for (const event of sortedEvents) {
      try {
        const start = parseISO(event.start)
        if (!start || isNaN(start.getTime())) throw new Error("Invalid start time")
        const startHour = start.getHours() + start.getMinutes() / 60

        let duration = 0.5
        if (event.end) {
          const end = parseISO(event.end)
          if (end && !isNaN(end.getTime())) {
            const endHour = end.getHours() + end.getMinutes() / 60
            if (endHour > startHour) duration = Math.max(0.5, endHour - startHour)
          }
        }

        const idealPixelPositionTop = startHour * pixelsPerHour
        const timelineSlotHeight = duration * pixelsPerHour

        let actualPixelPositionTop = idealPixelPositionTop
        let currentEventLeft = 0.0
        let currentEventWidth = 1.0

        // Check for conflicts and potential side-by-side placement
        let predecessorToShareWith: (typeof positions[0]) | null = null
        for (let i = positions.length - 1; i >= 0; i--) {
          const prevPos = positions[i]
          // Check for significant vertical overlap AND if prevPos is full width
          const verticalOverlap = Math.max(0, Math.min(idealPixelPositionTop + timelineSlotHeight, prevPos.top + prevPos.height) - Math.max(idealPixelPositionTop, prevPos.top));
          
          if (verticalOverlap > 0.5 * Math.min(timelineSlotHeight, prevPos.height)) { // Require at least 50% overlap of the shorter item
            if (prevPos.width === 1.0) { 
              predecessorToShareWith = prevPos
              break
            } 
            // If prevPos is already 0.5, and we want to allow current to be placed next to it without push down
            // This would be for a third item, which current logic doesn't turn into 33% columns.
            // For now, if it significantly overlaps a half-width item, it will be pushed down.
          }
        }

        if (predecessorToShareWith) {
          // Place side-by-side
          predecessorToShareWith.width = 0.5
          // predecessorToShareWith.left remains 0.0
          currentEventLeft = 0.5
          currentEventWidth = 0.5
          actualPixelPositionTop = idealPixelPositionTop // Place at its natural start time, NO PUSH DOWN
        } else {
          // No side-by-side, proceed with vertical push-down logic if necessary
          let testTop = idealPixelPositionTop
          let attempts = 0
          const maxAttempts = Math.max(10, sortedEvents.length) 
          
          while (attempts < maxAttempts) {
            let hasOverlapWithPlacedItems = false
            for (const placedPosition of positions) {
              // Check overlap with ALL placed items, considering their left/width for future multi-column checks
              // For now, since we only do 2 columns, this mostly simplifies to vertical check if widths are full or current is full
              const horizontalOverlap = (currentEventLeft < placedPosition.left + placedPosition.width) && 
                                      (currentEventLeft + currentEventWidth > placedPosition.left);
              const verticalOverlapForPush = (testTop < placedPosition.top + placedPosition.height) && 
                                           (testTop + timelineSlotHeight > placedPosition.top);

              if (horizontalOverlap && verticalOverlapForPush) {
                hasOverlapWithPlacedItems = true
                testTop = placedPosition.top + placedPosition.height + EVENT_GAP // Push below the item it overlapped with
                break // Recalculate overlaps from the new testTop
              }
            }
            if (!hasOverlapWithPlacedItems) break
            attempts++
          }
          actualPixelPositionTop = testTop
        }
        
        positions.push({
          top: actualPixelPositionTop,
          height: timelineSlotHeight,
          left: currentEventLeft,
          width: currentEventWidth,
          event,
        })
        // For occupiedSlots, we only care about the vertical span for push-down decisions of full-width items
        // If an item is placed side-by-side, it doesn't extend the *overall* occupied vertical range for push-down purposes
        // But if it's pushed down, it does. This needs careful thought for multi-column.
        // For simple 2-column, if an item ISN'T placed side-by-side, its full vertical slot is marked.
        if (currentEventWidth === 1.0) { // Only full-width items strictly define new occupied vertical slots for pushdown
            occupiedSlots.push({ start: actualPixelPositionTop, end: actualPixelPositionTop + timelineSlotHeight })
            occupiedSlots.sort((a, b) => a.start - b.start) 
        }

      } catch (e) {
        // Fallback for events with errors
        const lastOccupiedEnd = occupiedSlots.length > 0 ? Math.max(...occupiedSlots.map(slot => slot.end)) : 0
        const fallbackPositionTop = lastOccupiedEnd + EVENT_GAP
        const fallbackSlotHeight = 0.5 * pixelsPerHour
        positions.push({
          top: fallbackPositionTop, height: fallbackSlotHeight, left: 0, width: 1, event
        })
        occupiedSlots.push({ start: fallbackPositionTop, end: fallbackPositionTop + fallbackSlotHeight })
        occupiedSlots.sort((a, b) => a.start - b.start)
      }
    }
    let maxEventBottom = 0;
    if (positions.length > 0) {
        positions.forEach(pos => {
            const bottom = pos.top + pos.height;
            if (bottom > maxEventBottom) maxEventBottom = bottom;
        });
    }
    const timelineHeight = Math.max(24 * pixelsPerHour, maxEventBottom + 100);

    return { eventPositions: positions, pixelsPerHour, uniformCardHeight, timelineHeight }
  }

  const dayEvents = getEventsForDate(selectedDate)
  const { eventPositions, pixelsPerHour, uniformCardHeight, timelineHeight } = calculateLayoutParameters(dayEvents)

  useEffect(() => {
    if (eventPositions && eventPositions.length > 0 && !initialScrollDone) {
      // Find the event with the smallest `top` value
      let firstEventTop = Infinity;
      let firstEventId: string | null = null;

      eventPositions.forEach(pos => {
        if (pos.top < firstEventTop) {
          firstEventTop = pos.top;
          firstEventId = pos.event.id; // Assuming events have a unique ID
        }
      });

      if (firstEventId) {
        const firstEventRef = eventCardRefs.current.get(firstEventId);
        if (firstEventRef) {
          // Use a timeout to ensure the element is fully rendered and layout is stable
          setTimeout(() => {
            firstEventRef.scrollIntoView({
              behavior: 'smooth',
              block: 'start', // or 'center'
              inline: 'nearest'
            });
            setInitialScrollDone(true);
          }, 100); // Small delay
        }
      }
    }
    // Reset scroll flag if selectedDate changes, to allow re-scrolling for new day
  }, [eventPositions, initialScrollDone, selectedDate]); 

  // Reset initialScrollDone when selectedDate changes to allow scrolling for new day
  useEffect(() => {
    setInitialScrollDone(false);
  }, [selectedDate]);

  const getCurrentTimePosition = () => {
    if (!isToday(selectedDate)) return null
    const now = new Date()
    const berlinTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Berlin"}))
    const hours = berlinTime.getHours()
    const minutes = berlinTime.getMinutes()
    const totalHours = hours + minutes / 60
    const pixelPosition = totalHours * pixelsPerHour // Use dynamic pixelsPerHour
    
    return {
      pixels: pixelPosition,
      time: format(berlinTime, 'HH:mm', { locale: de })
    }
  }
  const currentTimePos = getCurrentTimePosition()

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
        <Badge className="bg-gray-500/20 text-gray-600 dark:text-gray-300 border-gray-500/30 text-xs">
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
              style={{ top: `${hour * pixelsPerHour}px` }}
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
              style={{ top: `${currentTimePos.pixels}px` }}
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
          <div className="absolute left-16 right-0 top-0 bottom-0">
            {dayEvents.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Keine Termine für diesen Tag</p>
                </div>
              </div>
            ) : (
              eventPositions.map((position, index) => {
                const event = position.event
                
                return (
                  <Card
                    ref={(el) => { 
                      if (event.id) { // Ensure event.id exists
                        if (el) {
                          eventCardRefs.current.set(event.id, el);
                        } else {
                          eventCardRefs.current.delete(event.id);
                        }
                      }
                    }}
                    key={event.id || index}
                    className={cn(
                      "absolute left-0 right-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer z-10",
                      getEventBorderClass(event)
                    )}
                    style={{ 
                      top: `${position.top}px`, 
                      height: `${position.height}px`, // Still using time-proportional height for card render
                      left: `${position.left * 100}%`, 
                      width: `${position.width * 100}%` 
                    }}
                    onClick={() => handleEventClick(event)}
                  >
                    <CardHeader className="px-2 pt-2 pb-0 overflow-hidden">
                      <div className="flex items-start justify-between gap-2 min-h-0">
                        <CardTitle className="text-sm leading-tight line-clamp-2 flex-1 min-w-0">
                          {event.title}
                        </CardTitle>
                        <div className="flex-shrink-0">
                          {getStatusBadge(event.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-2 pt-0 pb-1 overflow-hidden">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0 text-xs text-muted-foreground overflow-hidden">
                        {event.start && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Clock className="h-3 w-3" />
                            <span>
                              {formatTime(event.start)}
                              {event.end && ` - ${formatTime(event.end)}`}
                            </span>
                          </div>
                        )}
                        
                        {event.top && event.start && (
                          <span className="text-muted-foreground/70">•</span>
                        )}
                        
                        {event.top && (
                          <span className="truncate">
                            {event.top.toString().replace(/^TOP:?\s*/i, 'TOP: ')}
                          </span>
                        )}
                        
                        {event.status && (event.start || event.top) && (
                          <span className="text-muted-foreground/70">•</span>
                        )}
                        
                        {event.status && (
                          <span className="whitespace-nowrap">
                            Status:
                          </span>
                        )}
                         {event.status && (
                           <span className="flex-1 min-w-0 truncate">
                             {event.status} 
                           </span>
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

      <AgendaDetailsModal 
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        agendaItem={selectedAgendaItem}
      />
    </div>
  )
} 