// React import not needed due to react-jsx transform

export function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Om & Kontakt</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
        WestWallet är ett pågående projekt för personlig och hushållsekonomi. Funktioner kan ändras och fel kan förekomma.
        Målet är att samla utgifter, abonnemang, fordon, garantier och analyser i ett gemensamt gränssnitt med flexibla exportmöjligheter.
      </p>
      <div className="space-y-4">
        <section className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Kontakt</h2>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li><strong>E-post:</strong> utvecklare@example.com</li>
            <li><strong>Telefon:</strong> 070-000 00 00</li>
            <li><strong>Webb:</strong> coming soon</li>
          </ul>
        </section>
        <section className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Logotyp</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loggan placeras i vänstra hörnet och fungerar som länk till denna sida.</p>
        </section>
      </div>
    </div>
  );
}

export default About;
