'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BundestagAPI, BundestagAgendaItem } from '@/lib/bundestag-api'
import { CalendarDays, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { WeekView } from './week-view'
import { DayView } from './day-view'

type ViewMode = 'day' | 'week'

export function TagesordnungCalendar() {
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [agendaData, setAgendaData] = useState<BundestagAgendaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentWeek, setCurrentWeek] = useState(BundestagAPI.getCurrentWeek())

  // Load agenda data
  useEffect(() => {
    loadAgendaData()
  }, [currentWeek])

  const loadAgendaData = async () => {
    setLoading(true)
    try {
      const api = new BundestagAPI()
      const data = await api.fetchAgenda()
      setAgendaData(data)
    } catch (error) {
      console.error('Error loading agenda data:', error)
    } finally {
      setLoading(false)
    }
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (viewMode === 'day') {
      // Navigate days when in day view
      const newDate = new Date(selectedDate)
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
      setSelectedDate(newDate)
      
      // Update week if necessary
      const newWeek = BundestagAPI.getCurrentWeekForDate(newDate)
      setCurrentWeek(newWeek)
    } else {
      // Navigate weeks when in week view
      const newWeek = direction === 'next' ? currentWeek.week + 1 : currentWeek.week - 1
      let newYear = currentWeek.year

      if (newWeek > 52) {
        setCurrentWeek({ year: newYear + 1, week: 1 })
      } else if (newWeek < 1) {
        setCurrentWeek({ year: newYear - 1, week: 52 })
      } else {
        setCurrentWeek({ year: newYear, week: newWeek })
      }
    }
  }

  const goToCurrentWeek = () => {
    const today = new Date()
    setCurrentWeek(BundestagAPI.getCurrentWeek())
    setSelectedDate(today)
  }

  const getBerlinTime = () => {
    return new Date().toLocaleString("de-DE", {
      timeZone: "Europe/Berlin",
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getNavigationLabel = () => {
    if (viewMode === 'day') {
      return selectedDate.toLocaleDateString('de-DE', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      })
    } else {
      return `KW ${currentWeek.week} / ${currentWeek.year}`
    }
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Bundestag Tagesordnung
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {getBerlinTime()}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* View Mode Tabs */}
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
              <TabsList>
                <TabsTrigger value="day">Tag</TabsTrigger>
                <TabsTrigger value="week">Woche</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Navigation Controls */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
                Heute
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium px-3 py-1 bg-muted rounded">
                {getNavigationLabel()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Content */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground">Lade Tagesordnung...</p>
              </div>
            </div>
          ) : (
            <>
              {viewMode === 'day' && (
                <DayView 
                  selectedDate={selectedDate}
                  agendaData={agendaData}
                  onDateChange={setSelectedDate}
                />
              )}
              {viewMode === 'week' && (
                <WeekView 
                  currentWeek={currentWeek}
                  agendaData={agendaData}
                  onDateSelect={setSelectedDate}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 