export default function BesucheranmeldungPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Besucheranmeldung
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Besucherverwaltung und Akkreditierung
          </h2>
          <p className="text-gray-600 mb-4">
            Verwalten Sie Besucheranmeldungen für das Parlament, Büros und Veranstaltungen. 
            Koordinieren Sie Sicherheitschecks, Akkreditierungen und Zugriffsberechtigungen.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-800 mb-2">
              🚧 Diese Seite ist in Entwicklung
            </h3>
            <p className="text-blue-700">
              Die vollständige Funktionalität für die Besucheranmeldung wird in Kürze verfügbar sein.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              👤 Neuer Besucher
            </h3>
            <p className="text-gray-600 mb-4">
              Registrieren Sie einen neuen Besucher.
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Anmelden
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              👥 Gruppenanmeldung
            </h3>
            <p className="text-gray-600 mb-4">
              Anmeldung für Besuchergruppen verwalten.
            </p>
            <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
              Gruppe anlegen
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibelt text-gray-800 mb-4">
              🔍 Besuchersuche
            </h3>
            <p className="text-gray-600 mb-4">
              Suchen Sie nach registrierten Besuchern.
            </p>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
              Suchen
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📊 Auswertungen
            </h3>
            <p className="text-gray-600 mb-4">
              Statistiken und Berichte generieren.
            </p>
            <button className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors">
              Berichte
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📅 Heutige Besucher
            </h3>
            <div className="space-y-4">
              {[
                { 
                  name: "Maria Schneider", 
                  organization: "Umweltverband Bayern", 
                  time: "09:30 - 11:00", 
                  purpose: "Gespräch Klimapolitik",
                  host: "Dr. Anna Schmidt",
                  status: "Eingetroffen"
                },
                { 
                  name: "Thomas Wagner", 
                  organization: "Journalistenverband", 
                  time: "11:30 - 12:30", 
                  purpose: "Interview Sozialpolitik",
                  host: "Michael Weber",
                  status: "Angemeldet"
                },
                { 
                  name: "Schulklasse 10a", 
                  organization: "Gymnasium München", 
                  time: "14:00 - 15:30", 
                  purpose: "Parlamentsführung",
                  host: "Besucherdienst",
                  status: "Angemeldet"
                },
                { 
                  name: "Sarah Klein", 
                  organization: "Sozialverband", 
                  time: "16:00 - 17:00", 
                  purpose: "Bürgersprechstunde",
                  host: "Wahlkreisbüro",
                  status: "Bestätigt"
                },
              ].map((visitor, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{visitor.name}</h4>
                      <p className="text-sm text-gray-600">{visitor.organization}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      visitor.status === "Eingetroffen" 
                        ? "bg-green-100 text-green-800"
                        : visitor.status === "Bestätigt"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {visitor.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-1 text-sm text-gray-600 mb-3">
                    <div>
                      <span className="font-medium">Zeit:</span> {visitor.time}
                    </div>
                    <div>
                      <span className="font-medium">Zweck:</span> {visitor.purpose}
                    </div>
                    <div>
                      <span className="font-medium">Gastgeber:</span> {visitor.host}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-900 text-sm">
                      Details
                    </button>
                    <button className="text-green-600 hover:text-green-900 text-sm">
                      Check-in
                    </button>
                    <button className="text-orange-600 hover:text-orange-900 text-sm">
                      Bearbeiten
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              🛡️ Sicherheitsstatus
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <h4 className="font-medium text-green-800">Sicherheitscheck abgeschlossen</h4>
                </div>
                <p className="text-sm text-green-700">
                  Alle heutigen Besucher sind sicherheitsgeprüft.
                </p>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <h4 className="font-medium text-blue-800">Ausweise geprüft</h4>
                </div>
                <p className="text-sm text-blue-700">
                  Alle erforderlichen Dokumente sind verifiziert.
                </p>
              </div>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <h4 className="font-medium text-yellow-800">3 Besucher warten</h4>
                </div>
                <p className="text-sm text-yellow-700">
                  Sicherheitscheck steht noch aus.
                </p>
              </div>

              <div className="pt-3 border-t">
                <h4 className="font-medium text-gray-800 mb-3">Aktuelle Kapazitäten</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Eingangsbereich</span>
                    <span className="font-medium text-green-600">Normal</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sicherheitskontrolle</span>
                    <span className="font-medium text-yellow-600">Mittel</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Besucherzentrum</span>
                    <span className="font-medium text-green-600">Normal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📊 Besucherstatistiken
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">34</p>
                  <p className="text-sm text-gray-600">Heute angemeldet</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">28</p>
                  <p className="text-sm text-gray-600">Bereits eingetroffen</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">187</p>
                  <p className="text-sm text-gray-600">Diese Woche</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">742</p>
                  <p className="text-sm text-gray-600">Diesen Monat</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-800 mb-3">Besuchsarten</h4>
                <div className="space-y-2">
                  {[
                    { type: "Parlamentsführungen", count: 12, color: "bg-blue-500" },
                    { type: "Termine/Gespräche", count: 8, color: "bg-green-500" },
                    { type: "Bürgersprechstunde", count: 6, color: "bg-purple-500" },
                    { type: "Journalisten", count: 4, color: "bg-yellow-500" },
                    { type: "Veranstaltungen", count: 4, color: "bg-red-500" },
                  ].map((visit, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${visit.color}`}></div>
                        <span className="text-sm text-gray-700">{visit.type}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{visit.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              🎫 Akkreditierungen
            </h3>
            <div className="space-y-3">
              <div className="p-3 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Presse-Akkreditierungen</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">Aktiv: <span className="font-medium text-green-600">23</span></div>
                  <div className="text-gray-600">Pending: <span className="font-medium text-yellow-600">5</span></div>
                  <div className="text-gray-600">Abgelaufen: <span className="font-medium text-red-600">3</span></div>
                  <div className="text-gray-600">Gesamt: <span className="font-medium text-blue-600">31</span></div>
                </div>
              </div>

              <div className="p-3 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Besucher-Kategorien</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Reguläre Besucher</span>
                    <span className="font-medium">156</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">VIP-Gäste</span>
                    <span className="font-medium">12</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Schulgruppen</span>
                    <span className="font-medium">23</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delegationen</span>
                    <span className="font-medium">8</span>
                  </div>
                </div>
              </div>

              <div className="p-3 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Kommende Events</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tag der offenen Tür</span>
                    <span className="text-blue-600 font-medium">250 Anm.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Schülerbesuch</span>
                    <span className="text-green-600 font-medium">45 Anm.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pressekonferenz</span>
                    <span className="text-purple-600 font-medium">18 Anm.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📋 Registrierungsübersicht
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organisation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum/Zeit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zweck</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gastgeber</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[
                  { name: "Maria Schneider", org: "Umweltverband", date: "Heute 09:30", purpose: "Gespräch", host: "Dr. Schmidt", status: "Eingetroffen" },
                  { name: "Thomas Wagner", org: "Journalist", date: "Heute 11:30", purpose: "Interview", host: "M. Weber", status: "Angemeldet" },
                  { name: "Klasse 10a", org: "Gymnasium", date: "Heute 14:00", purpose: "Führung", host: "Besucherdienst", status: "Angemeldet" },
                  { name: "Sarah Klein", org: "Sozialverband", date: "Heute 16:00", purpose: "Sprechstunde", host: "Wahlkreisbüro", status: "Bestätigt" },
                  { name: "Dr. Hans Müller", org: "Universität", date: "Morgen 10:00", purpose: "Forschung", host: "Dr. Schmidt", status: "Genehmigt" },
                ].map((visitor, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{visitor.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{visitor.org}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{visitor.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{visitor.purpose}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{visitor.host}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        visitor.status === "Eingetroffen" 
                          ? "bg-green-100 text-green-800"
                          : visitor.status === "Bestätigt" || visitor.status === "Genehmigt"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {visitor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          Details
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          Check-in
                        </button>
                      </div>
                    </td>
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