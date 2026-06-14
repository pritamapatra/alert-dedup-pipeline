import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-semibold text-sm tracking-tight">
              Alert Dedup Pipeline
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="text-sm bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Built with Nexla Express
        </div>

        <h1 className="text-4xl sm:text-5xl font-semibold text-white tracking-tight max-w-2xl leading-tight mb-6">
          Stop drowning in
          <span className="text-emerald-400"> duplicate alerts</span>
        </h1>

        <p className="text-gray-400 text-lg max-w-xl leading-relaxed mb-10">
          A Nexla Express pipeline that ingests incident alerts, deduplicates
          noise by service and error signature, and delivers only actionable
          events to your engineering team.
        </p>

        <div className="flex items-center gap-4 flex-wrap justify-center">
          <Link
            href="/sign-up"
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Open Dashboard
          </Link>
          <Link
            href="/sign-in"
            className="border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Pipeline Architecture */}
      <section className="max-w-5xl mx-auto px-6 pb-20 w-full">
        <p className="text-xs text-gray-600 uppercase tracking-widest text-center mb-8">
          Pipeline Architecture
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              step: "01",
              title: "Ingest",
              description:
                "Raw incident alerts arrive via POST /api/ingest from any monitoring source.",
              color: "text-blue-400",
              border: "border-blue-500/20",
              bg: "bg-blue-500/5",
            },
            {
              step: "02",
              title: "Transform",
              description:
                "Nexla Express normalizes fields, builds error signatures, and checks the 1-hour dedupe window.",
              color: "text-emerald-400",
              border: "border-emerald-500/20",
              bg: "bg-emerald-500/5",
            },
            {
              step: "03",
              title: "Deliver",
              description:
                "Only unique, actionable alerts reach the destination. Duplicates are suppressed and counted.",
              color: "text-purple-400",
              border: "border-purple-500/20",
              bg: "bg-purple-500/5",
            },
          ].map((item) => (
            <div
              key={item.step}
              className={`rounded-xl border ${item.border} ${item.bg} px-6 py-5`}
            >
              <p className={`text-xs font-mono font-semibold mb-3 ${item.color}`}>
                {item.step}
              </p>
              <h3 className="text-white font-medium mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 text-center text-xs text-gray-600">
        Alert Dedup Pipeline — Nexla Express Take-Home Assessment
      </footer>
    </main>
  );
}