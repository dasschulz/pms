export default function AnfragenplanungPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Anfragenplanung
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Strategische Planung von Anfragen
          </h2>
          <p className="text-gray-600 mb-4">
            Planen Sie kleine Anfragen, schriftliche Fragen und andere parlamentarische Instrumente strategisch. 
            Koordinieren Sie Themen, Termine und Zuständigkeiten für maximale politische Wirkung.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-800 mb-2">
              🚧 Diese Seite ist in Entwicklung
            </h3>
            <p className="text-blue-700">
              Die vollständige Funktionalität für die Anfragenplanung wird in Kürze verfügbar sein.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📝 Neue Anfrage planen
            </h3>
            <p className="text-gray-600 mb-4">
              Erstellen Sie einen neuen Planungseintrag für eine kommende Anfrage.
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Anfrage hinzufügen
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📊 Themenplanung
            </h3>
            <p className="text-gray-600 mb-4">
              Koordinieren Sie Themen zwischen verschiedenen Anfragen.
            </p>
            <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
              Themen verwalten
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📅 Zeitplan
            </h3>
            <p className="text-gray-600 mb-4">
              Übersicht über alle geplanten Anfragen und Termine.
            </p>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
              Kalender öffnen
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              🎯 Aktuelle Planungen
            </h3>
            <div className="space-y-4">
              {[
                { title: "Klimaschutzmaßnahmen 2024", type: "Kleine Anfrage", deadline: "15.04.2024", status: "In Bearbeitung", priority: "Hoch" },
                { title: "Arbeitsmarktstatistik Q1", type: "Schriftliche Frage", deadline: "22.04.2024", status: "Geplant", priority: "Mittel" },
                { title: "Digitalisierung Schulen", type: "Kleine Anfrage", deadline: "30.04.2024", status: "Recherche", priority: "Niedrig" },
                { title: "Wohnungsbauprogramm", type: "Kleine Anfrage", deadline: "05.05.2024", status: "Geplant", priority: "Hoch" },
              ].map((inquiry, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{inquiry.title}</h4>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      inquiry.priority === "Hoch" 
                        ? "bg-red-100 text-red-800"
                        : inquiry.priority === "Mittel"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}>
                      {inquiry.priority}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Typ:</span> {inquiry.type}
                    </div>
                    <div>
                      <span className="font-medium">Deadline:</span> {inquiry.deadline}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Status:</span> 
                      <span className={`ml-1 px-2 py-1 text-xs rounded ${
                        inquiry.status === "In Bearbeitung" 
                          ? "bg-blue-100 text-blue-800"
                          : inquiry.status === "Geplant"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-orange-100 text-orange-800"
                      }`}>
                        {inquiry.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="text-blue-600 hover:text-blue-900 text-sm">
                      Bearbeiten
                    </button>
                    <button className="text-green-600 hover:text-green-900 text-sm">
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📈 Planungsstatistiken
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">12</p>
                  <p className="text-sm text-gray-600">Geplante Anfragen</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">5</p>
                  <p className="text-sm text-gray-600">In Bearbeitung</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">3</p>
                  <p className="text-sm text-gray-600">Überfällig</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">8</p>
                  <p className="text-sm text-gray-600">Diesen Monat</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-800 mb-3">Themenverteilung</h4>
                <div className="space-y-2">
                  {[
                    { theme: "Umwelt & Klima", count: 4, color: "bg-green-500" },
                    { theme: "Soziales", count: 3, color: "bg-blue-500" },
                    { theme: "Wirtschaft", count: 3, color: "bg-purple-500" },
                    { theme: "Bildung", count: 2, color: "bg-yellow-500" },
                  ].map((theme, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${theme.color}`}></div>
                        <span className="text-sm text-gray-700">{theme.theme}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{theme.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-800 mb-3">Kommende Deadlines</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Klimaschutzmaßnahmen</span>
                    <span className="text-red-600 font-medium">in 5 Tagen</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Arbeitsmarktstatistik</span>
                    <span className="text-orange-600 font-medium">in 12 Tagen</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Digitalisierung Schulen</span>
                    <span className="text-gray-600 font-medium">in 20 Tagen</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📊 Monatsübersicht
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KW</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kleine Anfragen</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schriftliche Fragen</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sonstiges</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gesamt</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[
                  { week: "KW 15", kleine: 2, schriftliche: 1, sonstiges: 0, total: 3 },
                  { week: "KW 16", kleine: 1, schriftliche: 3, sonstiges: 1, total: 5 },
                  { week: "KW 17", kleine: 3, schriftliche: 2, sonstiges: 0, total: 5 },
                  { week: "KW 18", kleine: 1, schriftliche: 1, sonstiges: 2, total: 4 },
                ].map((week, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{week.week}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{week.kleine}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{week.schriftliche}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{week.sonstiges}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{week.total}</td>
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