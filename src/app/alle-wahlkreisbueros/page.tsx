export default function AlleWahlkreisbuerosPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Alle Wahlkreisbüros
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Übersicht der Wahlkreisbüros
          </h2>
          <p className="text-gray-600 mb-4">
            Hier finden Sie eine Übersicht aller Wahlkreisbüros mit ihren Kontaktdaten und Öffnungszeiten.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-800 mb-2">
              🚧 Diese Seite ist in Entwicklung
            </h3>
            <p className="text-blue-700">
              Die vollständige Funktionalität wird in Kürze verfügbar sein. 
              Hier werden bald alle Wahlkreisbüros mit detaillierten Informationen angezeigt.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder cards for future content */}
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Wahlkreisbüro {index}
              </h3>
              <p className="text-gray-600 mb-2">
                Musterstraße {index}, 12345 Musterstadt
              </p>
              <p className="text-sm text-gray-500">
                Tel: +49 (0) 123 456 78{index}0
              </p>
              <p className="text-sm text-gray-500">
                Email: buero{index}@example.de
              </p>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700">Öffnungszeiten:</p>
                <p className="text-sm text-gray-600">Mo-Fr: 9:00-17:00</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 