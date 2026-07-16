import React from 'react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background radial gradients for dynamic look */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-900/20 rounded-full blur-3xl" />

      <main className="max-w-4xl w-full z-10 text-center space-y-12">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-medium animate-pulse">
            🛡️ Production-Ready Parental Control
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-teal-400 to-indigo-400 bg-clip-text text-transparent">
            SafeSignal
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
            Protect your children from harmful websites. No apps to install. No dashboards to log into. Manage everything seamlessly via WhatsApp.
          </p>
        </header>

        {/* Feature Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-blue-500/50 transition-all duration-300 group">
            <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">💬</div>
            <h3 className="text-lg font-semibold text-slate-200 mb-2">WhatsApp Controlled</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Register, manage, and check the protection status of all your children's devices with simple text commands.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-teal-500/50 transition-all duration-300 group">
            <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">⚡</div>
            <h3 className="text-lg font-semibold text-slate-200 mb-2">Private DNS Protection</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Route traffic securely through our private DNS. Android-native configuration prevents child bypasses.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-indigo-500/50 transition-all duration-300 group">
            <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">⚠️</div>
            <h3 className="text-lg font-semibold text-slate-200 mb-2">Real-time Alerts</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Receive immediate WhatsApp notifications detailing the blocked website, category, and exact timestamp.
            </p>
          </div>
        </section>

        {/* Simulated Mock Alert */}
        <section className="max-w-md mx-auto p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs text-slate-500 font-mono">SIMULATED WHATSAPP NOTIFICATION</span>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/50 text-left font-mono text-xs text-slate-300 whitespace-pre">
            ⚠️ SafeSignal Alert
            <br />
            <br />
            Child: Melissa
            <br />
            Blocked website: xvideos.com
            <br />
            Category: Adult
            <br />
            Time: 20:41
          </div>
        </section>

        <footer className="pt-6 border-t border-slate-900 text-xs text-slate-600">
          SafeSignal &copy; 2026. All rights reserved. Built for modern parental safety.
        </footer>
      </main>
    </div>
  );
}
