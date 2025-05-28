export default function TransparenzPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Transparenz
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Transparenz und Offenlegung
          </h2>
          <p className="text-gray-600 mb-4">
            Verwalten Sie alle transparenzbezogenen Daten und Veröffentlichungen. 
            Dokumentieren Sie Nebentätigkeiten, Spenden, Reisen und andere offenlegungspflichtige Aktivitäten.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-800 mb-2">
              🚧 Diese Seite ist in Entwicklung
            </h3>
            <p className="text-blue-700">
              Die vollständige Funktionalität für Transparenz-Features wird in Kürze verfügbar sein.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              💼 Nebentätigkeiten
            </h3>
            <p className="text-gray-600 mb-4">
              Dokumentieren Sie alle Nebentätigkeiten und Mandate.
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Eintrag hinzufügen
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              💰 Spenden
            </h3>
            <p className="text-gray-600 mb-4">
              Verwalten Sie erhaltene Spenden und Zuwendungen.
            </p>
            <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
              Spende erfassen
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              ✈️ Reisen
            </h3>
            <p className="text-gray-600 mb-4">
              Dokumentieren Sie gesponserte Reisen und Einladungen.
            </p>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
              Reise melden
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📊 Berichte
            </h3>
            <p className="text-gray-600 mb-4">
              Erstellen Sie Transparenzberichte und Übersichten.
            </p>
            <button className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors">
              Bericht erstellen
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📋 Aktuelle Einträge
            </h3>
            <div className="space-y-4">
              {[
                { 
                  type: "Nebentätigkeit", 
                  title: "Beirat Umweltstiftung", 
                  date: "15.03.2024", 
                  status: "Veröffentlicht",
                  amount: "unentgeltlich"
                },
                { 
                  type: "Spende", 
                  title: "Privatspende", 
                  date: "10.03.2024", 
                  status: "Geprüft",
                  amount: "€ 1.200"
                },
                { 
                  type: "Reise", 
                  title: "Konferenz Klimawandel, Brüssel", 
                  date: "05.03.2024", 
                  status: "Dokumentiert",
                  amount: "€ 890"
                },
                { 
                  type: "Nebentätigkeit", 
                  title: "Gastvorlesung Universität", 
                  date: "28.02.2024", 
                  status: "Eingereicht",
                  amount: "€ 500"
                },
              ].map((entry, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full mr-2 ${
                        entry.type === "Nebentätigkeit" 
                          ? "bg-blue-100 text-blue-800"
                          : entry.type === "Spende"
                          ? "bg-green-100 text-green-800"
                          : "bg-purple-100 text-purple-800"
                      }`}>
                        {entry.type}
                      </span>
                      <h4 className="font-medium text-gray-900 inline">{entry.title}</h4>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      entry.status === "Veröffentlicht" 
                        ? "bg-green-100 text-green-800"
                        : entry.status === "Geprüft"
                        ? "bg-blue-100 text-blue-800"
                        : entry.status === "Dokumentiert"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {entry.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Datum:</span> {entry.date}
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    <span className="font-medium">Wert:</span> {entry.amount}
                  </div>
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-900 text-sm">
                      Bearbeiten
                    </button>
                    <button className="text-green-600 hover:text-green-900 text-sm">
                      Details
                    </button>
                    <button className="text-purple-600 hover:text-purple-900 text-sm">
                      Veröffentlichen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📊 Transparenzstatistiken
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">12</p>
                  <p className="text-sm text-gray-600">Nebentätigkeiten</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">€ 4.650</p>
                  <p className="text-sm text-gray-600">Spenden gesamt</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">8</p>
                  <p className="text-sm text-gray-600">Gesponserte Reisen</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">€ 7.890</p>
                  <p className="text-sm text-gray-600">Reisekosten gesamt</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-800 mb-3">Status-Übersicht</h4>
                <div className="space-y-2">
                  {[
                    { status: "Veröffentlicht", count: 18, color: "bg-green-500" },
                    { status: "Geprüft", count: 5, color: "bg-blue-500" },
                    { status: "Eingereicht", count: 3, color: "bg-yellow-500" },
                    { status: "Entwurf", count: 2, color: "bg-gray-500" },
                  ].map((status, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
                        <span className="text-sm text-gray-700">{status.status}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{status.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-800 mb-3">Nächste Fristen</h4>
                <div className="space-y-2">
                  {[
                    { task: "Quartalsbericht Q1", deadline: "30.04.2024" },
                    { task: "Nebentätigkeiten Update", deadline: "15.05.2024" },
                    { task: "Spendenbericht", deadline: "31.05.2024" },
                  ].map((task, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">{task.task}</span>
                      <span className="text-red-600 font-medium">{task.deadline}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              🔍 Compliance-Check
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-800">Nebentätigkeiten aktuell</span>
                </div>
                <span className="text-xs text-green-600">✓ Vollständig</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-800">Spenden dokumentiert</span>
                </div>
                <span className="text-xs text-green-600">✓ Vollständig</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium text-yellow-800">Reisen Q1 2024</span>
                </div>
                <span className="text-xs text-yellow-600">⚠ Unvollständig</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-red-800">Quartalsbericht überfällig</span>
                </div>
                <span className="text-xs text-red-600">✗ Fehlt</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📄 Berichte & Export
            </h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">Jahresbericht 2023</span>
                  <span className="text-sm text-gray-500">PDF</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Vollständiger Transparenzbericht</p>
              </button>
              
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">Nebentätigkeiten Export</span>
                  <span className="text-sm text-gray-500">CSV</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Alle Nebentätigkeiten als Tabelle</p>
              </button>
              
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">Spenden-Übersicht</span>
                  <span className="text-sm text-gray-500">PDF</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Zusammenfassung aller Spenden</p>
              </button>
              
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">Reisekosten Q1-Q4</span>
                  <span className="text-sm text-gray-500">XLS</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Detaillierte Reisekostenabrechnung</p>
              </button>
              
              <div className="pt-3 border-t">
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                  Neuen Bericht erstellen
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 