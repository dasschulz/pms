export default function RaumbuchungPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Raumbuchung
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Raumreservierung und -verwaltung
          </h2>
          <p className="text-gray-600 mb-4">
            Buchen Sie Räume für Termine, Besprechungen und Veranstaltungen. 
            Verwalten Sie Verfügbarkeiten, Ausstattung und Zugriffsberechtigungen zentral.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-800 mb-2">
              🚧 Diese Seite ist in Entwicklung
            </h3>
            <p className="text-blue-700">
              Die vollständige Funktionalität für die Raumbuchung wird in Kürze verfügbar sein.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📅 Schnellbuchung
            </h3>
            <p className="text-gray-600 mb-4">
              Buchen Sie schnell einen verfügbaren Raum.
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Raum buchen
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              🔍 Verfügbarkeit prüfen
            </h3>
            <p className="text-gray-600 mb-4">
              Überprüfen Sie freie Zeiten und Räume.
            </p>
            <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
              Suchen
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              ⚙️ Raumverwaltung
            </h3>
            <p className="text-gray-600 mb-4">
              Verwalten Sie Räume und deren Ausstattung.
            </p>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
              Räume verwalten
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📊 Statistiken
            </h3>
            <p className="text-gray-600 mb-4">
              Auslastung und Nutzungsstatistiken.
            </p>
            <button className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors">
              Berichte anzeigen
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📋 Heutige Buchungen
            </h3>
            <div className="space-y-4">
              {[
                { 
                  room: "Konferenzraum A", 
                  time: "09:00 - 11:00", 
                  title: "Fraktionssitzung", 
                  organizer: "Fraktionsführung",
                  attendees: 25,
                  status: "Bestätigt"
                },
                { 
                  room: "Besprechungsraum 1", 
                  time: "11:30 - 12:30", 
                  title: "AG Umwelt Koordination", 
                  organizer: "Dr. Anna Schmidt",
                  attendees: 8,
                  status: "Bestätigt"
                },
                { 
                  room: "Mehrzweckraum", 
                  time: "14:00 - 16:00", 
                  title: "Pressegespräch Klimapolitik", 
                  organizer: "Pressestelle",
                  attendees: 15,
                  status: "Vorläufig"
                },
                { 
                  room: "Konferenzraum B", 
                  time: "16:30 - 18:00", 
                  title: "Bürgersprechstunde", 
                  organizer: "Wahlkreisbüro",
                  attendees: 12,
                  status: "Bestätigt"
                },
              ].map((booking, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{booking.title}</h4>
                      <p className="text-sm text-gray-600">{booking.room} • {booking.time}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      booking.status === "Bestätigt" 
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                    <div>
                      <span className="font-medium">Organisator:</span> {booking.organizer}
                    </div>
                    <div>
                      <span className="font-medium">Teilnehmer:</span> {booking.attendees}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-900 text-sm">
                      Details
                    </button>
                    <button className="text-green-600 hover:text-green-900 text-sm">
                      Bearbeiten
                    </button>
                    <button className="text-red-600 hover:text-red-900 text-sm">
                      Stornieren
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              🏢 Verfügbare Räume
            </h3>
            <div className="space-y-3">
              {[
                { name: "Konferenzraum A", capacity: 30, available: true, equipment: ["Beamer", "Flipchart", "Audio"] },
                { name: "Konferenzraum B", capacity: 20, available: false, equipment: ["Beamer", "Whiteboard"] },
                { name: "Besprechungsraum 1", capacity: 8, available: true, equipment: ["Monitor", "Whiteboard"] },
                { name: "Besprechungsraum 2", capacity: 6, available: true, equipment: ["Monitor"] },
                { name: "Mehrzweckraum", capacity: 50, available: false, equipment: ["Bühne", "Audio", "Video"] },
                { name: "Arbeitsraum Klein", capacity: 4, available: true, equipment: ["Whiteboard"] },
              ].map((room, index) => (
                <div key={index} className={`border rounded-lg p-3 ${
                  room.available ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{room.name}</h4>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      room.available 
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {room.available ? "Verfügbar" : "Belegt"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Kapazität: {room.capacity} Personen
                  </p>
                  <div className="text-xs text-gray-500">
                    {room.equipment.join(" • ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📊 Buchungsstatistiken
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">23</p>
                  <p className="text-sm text-gray-600">Buchungen heute</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">87%</p>
                  <p className="text-sm text-gray-600">Auslastung</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">156</p>
                  <p className="text-sm text-gray-600">Buchungen Woche</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">12</p>
                  <p className="text-sm text-gray-600">Verfügbare Räume</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-800 mb-3">Beliebte Zeiten</h4>
                <div className="space-y-2">
                  {[
                    { time: "09:00 - 11:00", bookings: 18, color: "bg-blue-500" },
                    { time: "11:00 - 13:00", bookings: 15, color: "bg-green-500" },
                    { time: "14:00 - 16:00", bookings: 22, color: "bg-purple-500" },
                    { time: "16:00 - 18:00", bookings: 12, color: "bg-yellow-500" },
                  ].map((slot, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${slot.color}`}></div>
                        <span className="text-sm text-gray-700">{slot.time}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{slot.bookings}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              🔧 Raum-Features
            </h3>
            <div className="space-y-3">
              <div className="p-3 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Technische Ausstattung</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>• Beamer verfügbar: 8 Räume</div>
                  <div>• Audio-System: 4 Räume</div>
                  <div>• Videokonferenz: 6 Räume</div>
                  <div>• Flipchart: 10 Räume</div>
                  <div>• Whiteboard: 9 Räume</div>
                  <div>• Klimaanlage: 12 Räume</div>
                </div>
              </div>

              <div className="p-3 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Kapazitäten</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">4-6 Personen</span>
                    <span className="font-medium">3 Räume</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">8-20 Personen</span>
                    <span className="font-medium">5 Räume</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">25-50 Personen</span>
                    <span className="font-medium">4 Räume</span>
                  </div>
                </div>
              </div>

              <div className="p-3 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Besondere Räume</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>• Barrierefreier Zugang: 8 Räume</div>
                  <div>• Küche/Catering: 3 Räume</div>
                  <div>• Bühne/Podium: 2 Räume</div>
                  <div>• Outdoor-Bereich: 1 Raum</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📅 Wochenübersicht
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zeit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montag</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dienstag</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mittwoch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Donnerstag</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Freitag</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[
                  { time: "09:00-11:00", mon: "Fraktion (KR-A)", tue: "AG Umwelt (BR-1)", wed: "Vorstand (KR-B)", thu: "Team-Meeting (BR-2)", fri: "Bürgersprechstunde" },
                  { time: "11:00-13:00", mon: "Presse (MZ)", tue: "Recherche", wed: "Ausschuss (KR-A)", thu: "Planung (BR-1)", fri: "Koordination" },
                  { time: "14:00-16:00", mon: "Workshop", tue: "Schulung (KR-B)", wed: "Anhörung (MZ)", thu: "Interview", fri: "Abschluss" },
                  { time: "16:00-18:00", mon: "Beratung", tue: "Termine", wed: "Diskussion", thu: "Vorbereitung", fri: "Wochenende" },
                ].map((row, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.time}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.mon}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.tue}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.wed}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.thu}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.fri}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 