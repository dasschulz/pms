export default function JournalistenpoolPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Journalistenpool
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Pressekontakte verwalten
          </h2>
          <p className="text-gray-600 mb-4">
            Verwalten Sie Ihre Kontakte zu Journalistinnen und Journalisten verschiedener Medien. 
            Organisieren Sie Pressekontakte für gezielte Kommunikation und Medienarbeit.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-800 mb-2">
              🚧 Diese Seite ist in Entwicklung
            </h3>
            <p className="text-blue-700">
              Die vollständige Funktionalität für den Journalistenpool wird in Kürze verfügbar sein.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📰 Journalist hinzufügen
            </h3>
            <p className="text-gray-600 mb-4">
              Neue Pressekontakte zum Pool hinzufügen.
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Neuen Kontakt anlegen
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              🔍 Kontakte suchen
            </h3>
            <p className="text-gray-600 mb-4">
              Nach Medien oder Themenbereichen durchsuchen.
            </p>
            <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
              Erweiterte Suche
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📧 Verteiler erstellen
            </h3>
            <p className="text-gray-600 mb-4">
              Zielgerichtete E-Mail-Verteiler verwalten.
            </p>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
              Neuen Verteiler
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              📋 Pressekontakte
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nach Namen oder Medium suchen..."
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Alle Medientypen</option>
                <option>Tageszeitungen</option>
                <option>Online-Medien</option>
                <option>Radio</option>
                <option>Fernsehen</option>
                <option>Magazine</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Medium
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ressort
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Region
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kontakt-Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Placeholder rows */}
                {[
                  { name: "Lisa Hoffmann", medium: "Süddeutsche Zeitung", department: "Politik", region: "Bayern", rating: "⭐⭐⭐⭐⭐" },
                  { name: "Marcus Schmidt", medium: "ARD Hauptstadtstudio", department: "Innenpolitik", region: "Berlin", rating: "⭐⭐⭐⭐" },
                  { name: "Jana Weber", medium: "Der Spiegel", department: "Wirtschaft", region: "Hamburg", rating: "⭐⭐⭐⭐⭐" },
                  { name: "Tom Müller", medium: "t-online.de", department: "Politik", region: "Bundesweit", rating: "⭐⭐⭐" },
                  { name: "Sarah Klein", medium: "Frankfurter Rundschau", department: "Soziales", region: "Hessen", rating: "⭐⭐⭐⭐" },
                ].map((journalist, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {journalist.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {journalist.medium}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {journalist.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {journalist.region}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {journalist.rating}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex gap-2">
                        <button className="text-indigo-600 hover:text-indigo-900">
                          Bearbeiten
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          E-Mail
                        </button>
                        <button className="text-blue-600 hover:text-blue-900">
                          Anrufen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📊 Medienverteilung
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Print</span>
                <span className="text-sm font-medium">34%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{width: '34%'}}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Online</span>
                <span className="text-sm font-medium">28%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{width: '28%'}}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">TV</span>
                <span className="text-sm font-medium">23%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{width: '23%'}}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Radio</span>
                <span className="text-sm font-medium">15%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-600 h-2 rounded-full" style={{width: '15%'}}></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📈 Aktivitätsübersicht
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">127</p>
                <p className="text-sm text-gray-600">Gesamte Kontakte</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">43</p>
                <p className="text-sm text-gray-600">Aktive Kontakte</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">18</p>
                <p className="text-sm text-gray-600">Diese Woche kontaktiert</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">7</p>
                <p className="text-sm text-gray-600">Neue Kontakte</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 