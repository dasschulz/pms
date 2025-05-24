'use client'

import React from 'react'
import { BundestagAgendaItem } from '@/lib/bundestag-api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { Calendar, Clock, FileText, Link as LinkIcon, CheckCircle } from 'lucide-react'

interface AgendaDetailsModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  agendaItem: BundestagAgendaItem | null
}

export function AgendaDetailsModal({ isOpen, onOpenChange, agendaItem }: AgendaDetailsModalProps) {
  if (!agendaItem) return null

  const formatDateTime = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      return format(date, 'EEEE, d. MMMM yyyy \'um\' HH:mm \'Uhr\'', { locale: de })
    } catch {
      return dateString
    }
  }

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase()
    
    if (statusLower.includes('angenommen')) {
      return 'text-green-600'
    }
    
    if (statusLower.includes('abgelehnt')) {
      return 'text-red-600'
    }
    
    if (statusLower.includes('überweisung') || statusLower.includes('überwiesen')) {
      return 'text-gray-600'
    }
    
    return 'text-muted-foreground'
  }

  // Check if this is a Die Linke item for border indicator
  const isLinkeItem = agendaItem.description?.toLowerCase().includes('der fraktion die linke') || 
                      agendaItem.title?.toLowerCase().includes('der fraktion die linke')

  // Remove status information from description to avoid duplication
  const cleanDescription = (description: string) => {
    if (!description) return description
    
    // Remove common status patterns from description
    return description
      .replace(/Status:\s*(angenommen|abgelehnt|.*?)\s*/gi, '')
      .replace(/\s*Status\s*$/gi, '')
      .trim()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-[600px] bg-background/10 backdrop-blur-sm border max-h-[80vh] overflow-y-auto ${
        isLinkeItem ? 'border-red-500' : 'border-border'
      }`}>
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold font-work-sans">
            Tagesordnungspunkt Details
          </DialogTitle>
          <DialogDescription className="text-center">
            Vollständige Informationen zum Agenda-Punkt
          </DialogDescription>
        </DialogHeader>
        
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg leading-tight">
              {agendaItem.title}
            </CardTitle>
            {/* Status as subheading with color indicator */}
            {agendaItem.status && (
              <div className={`text-sm font-medium mt-2 ${getStatusColor(agendaItem.status)}`}>
                {agendaItem.status}
              </div>
            )}
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Time Information */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Zeitraum:</span>
              </div>
              <div className="ml-6 space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>Start: {formatDateTime(agendaItem.start)}</span>
                </div>
                {agendaItem.end && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>Ende: {formatDateTime(agendaItem.end)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* TOP Number - as one line without border */}
            {agendaItem.top && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Tagesordnungspunkt {agendaItem.top}</span>
                </div>
              </div>
            )}

            {/* Description - without border */}
            {agendaItem.description && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Beschreibung:</span>
                </div>
                <div className="ml-6">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {cleanDescription(agendaItem.description)}
                  </p>
                </div>
              </div>
            )}

            {/* Additional Information */}
            {(agendaItem as any).url && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Weitere Informationen:</span>
                </div>
                <div className="ml-6">
                  <a 
                    href={(agendaItem as any).url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline break-all"
                  >
                    {(agendaItem as any).url}
                  </a>
                </div>
              </div>
            )}

            {/* Namentliche Abstimmung */}
            {(agendaItem as any).namentliche_abstimmung && (
              <div className="p-3 bg-amber-500/10 backdrop-blur-sm rounded-lg border border-amber-500/30">
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Namentliche Abstimmung</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
} 