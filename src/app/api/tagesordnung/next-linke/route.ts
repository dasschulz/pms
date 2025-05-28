import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { BundestagAPI } from '@/lib/bundestag-api';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Nicht autorisiert' 
      }, { status: 401 });
    }

    // Fetch agenda data
    const api = new BundestagAPI();
    const agendaData = await api.fetchAgenda();
    
    // Filter for LINKE appointments and find the next one
    const now = new Date();
    const linkeAppointments = agendaData.filter(item => {
      // Check if title contains LINKE or DIE LINKE
      const isLinke = item.title.toLowerCase().includes('linke') || 
                      item.title.toLowerCase().includes('die linke');
      
      // Check if it's in the future
      const appointmentDate = new Date(item.start);
      const isFuture = appointmentDate > now;
      
      return isLinke && isFuture;
    });

    // Sort by date and get the next one
    linkeAppointments.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    const nextAppointment = linkeAppointments[0] || null;

    return NextResponse.json({
      success: true,
      appointment: nextAppointment
    });
  } catch (error) {
    console.error('Error fetching next LINKE appointment:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Fehler beim Laden des nächsten LINKE-Termins' 
    }, { status: 500 });
  }
} 