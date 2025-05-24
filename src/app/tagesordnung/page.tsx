import React from 'react'
import { TagesordnungCalendar } from '@/components/tagesordnung/tagesordnung-calendar'

export default function TagesordnungPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tagesordnung</h1>
          <p className="text-muted-foreground">
            Bundestag-Tagesordnung im Kalenderformat
          </p>
        </div>
        <TagesordnungCalendar />
      </div>
    </div>
  )
} 