export default function ReferentenpoolPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Referentenpool
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Expertinnen und Experten verwalten
          </h2>
          <p className="text-gray-600 mb-4">
            Verwalten Sie Ihre Kontakte zu Referentinnen und Referenten aus verschiedenen Fachbereichen. 
            Organisieren Sie Expertenwissen für Veranstaltungen, Anhörungen und Beratungen.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-800 mb-2">
              🚧 Diese Seite ist in Entwicklung
            </h3>
            <p className="text-blue-700">
              Die vollständige Funktionalität für den Referentenpool wird in Kürze verfügbar sein.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              👥 Referenten hinzufügen
            </h3>
            <p className="text-gray-600 mb-4">
              Neue Expertinnen und Experten zum Pool hinzufügen.
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Neuen Referenten anlegen
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              🔍 Experten suchen
            </h3>
            <p className="text-gray-600 mb-4">
              Nach Fachbereichen oder Themen durchsuchen.
            </p>
            <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
              Erweiterte Suche
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📊 Statistiken
            </h3>
            <p className="text-gray-600 mb-4">
              Übersicht über Kontakte und Nutzung.
            </p>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
              Berichte anzeigen
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              📋 Aktuelle Referenten
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nach Namen oder Fachbereich suchen..."
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Alle Fachbereiche</option>
                <option>Wirtschaft</option>
                <option>Umwelt</option>
                <option>Soziales</option>
                <option>Bildung</option>
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
                    Fachbereich
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Institution
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verfügbarkeit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Placeholder rows */}
                {[
                  { name: "Dr. Anna Schmidt", field: "Klimapolitik", institution: "Umweltinstitut Berlin", availability: "Verfügbar" },
                  { name: "Prof. Michael Weber", field: "Arbeitsrecht", institution: "Universität Hamburg", availability: "Begrenzt" },
                  { name: "Dr. Sarah Müller", field: "Digitalisierung", institution: "Tech Institut", availability: "Verfügbar" },
                  { name: "Prof. Thomas Klein", field: "Sozialpolitik", institution: "FH Köln", availability: "Nicht verfügbar" },
                ].map((expert, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {expert.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {expert.field}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {expert.institution}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        expert.availability === "Verfügbar" 
                          ? "bg-green-100 text-green-800"
                          : expert.availability === "Begrenzt"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {expert.availability}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex gap-2">
                        <button className="text-indigo-600 hover:text-indigo-900">
                          Bearbeiten
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          Kontaktieren
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Gesamte Referenten</h4>
            <p className="text-2xl font-bold text-blue-600">47</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">Verfügbar</h4>
            <p className="text-2xl font-bold text-green-600">31</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">Begrenzt verfügbar</h4>
            <p className="text-2xl font-bold text-yellow-600">12</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-2">Nicht verfügbar</h4>
            <p className="text-2xl font-bold text-red-600">4</p>
          </div>
        </div>
      </div>
    </div>
  );
} 