"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function VerifyPage() {
  const params = useParams();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<{ childName: string; childPhone: string } | null>(null);
  
  const [verifying, setVerifying] = useState(false);
  const [verifiedData, setVerifiedData] = useState<{ dnsIdentifier: string; childName: string } | null>(null);

  // We should dynamically point to the NestJS API url.
  // In Docker Compose, the backend is on port 3000, so localhost:3000 will be used by the browser.
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    if (!token) return;

    // 1. Fetch token validity from NestJS backend
    const checkToken = async () => {
      try {
        const res = await fetch(`${API_BASE}/verify/${token}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Token is invalid or expired');
        }
        const data = await res.json();
        setTokenData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, [token]);

  const handleContinue = async () => {
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Verification failed');
      }

      const data = await res.json();
      setVerifiedData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-light">Validating secure link...</p>
        </div>
      </div>
    );
  }

  if (error && !verifiedData) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900 border border-red-500/20 text-center space-y-6">
          <div className="text-5xl">❌</div>
          <h2 className="text-2xl font-bold text-slate-200">Unable to Proceed</h2>
          <p className="text-sm text-slate-400 leading-relaxed">{error}</p>
          <p className="text-xs text-slate-500">
            Please ask your parent to send a new verification link via WhatsApp.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl" />

      <main className="max-w-md w-full z-10 p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-2xl space-y-6">
        {!verifiedData ? (
          // Consent Screen
          <>
            <div className="space-y-2 text-center">
              <div className="inline-block text-3xl">🛡️</div>
              <h2 className="text-2xl font-extrabold text-slate-200">Enable SafeSignal</h2>
              {tokenData?.childName && (
                <p className="text-sm text-blue-400 font-medium">Hello, {tokenData.childName}!</p>
              )}
            </div>

            <p className="text-sm text-slate-400 leading-relaxed text-center">
              SafeSignal protects your device by automatically blocking harmful domains such as adult content, gambling, violence, malware, and phishing.
            </p>

            <div className="space-y-4">
              <button
                onClick={handleContinue}
                disabled={verifying}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold transition-all duration-300 shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                {verifying ? 'Enabling Protection...' : 'Continue to enable protection'}
              </button>
            </div>
          </>
        ) : (
          // Success & Private DNS Setup Instructions
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-block text-4xl">🎉</div>
              <h2 className="text-2xl font-extrabold text-emerald-400">Protection Enabled</h2>
              <p className="text-sm text-slate-400">
                SafeSignal is now active for <span className="text-slate-200 font-semibold">{verifiedData.childName}</span>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-500 font-mono block">YOUR UNIQUE IDENTIFIER:</span>
              <span className="text-lg font-mono font-bold text-blue-400 block tracking-wider">
                {verifiedData.dnsIdentifier}
              </span>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                Android Private DNS Setup
              </h3>
              
              <ol className="space-y-3 text-sm text-slate-400 list-decimal pl-4">
                <li>
                  Open your phone's <span className="text-slate-300 font-medium">Settings</span> app.
                </li>
                <li>
                  Go to <span className="text-slate-300 font-medium">Network & Internet</span> &gt; <span className="text-slate-300 font-medium">Private DNS</span> (or search "Private DNS" in settings).
                </li>
                <li>
                  Select <span className="text-slate-300 font-medium">Private DNS provider hostname</span>.
                </li>
                <li>
                  Enter: <code className="px-1.5 py-0.5 rounded bg-slate-950 text-indigo-400 border border-slate-800 font-mono">dns.safesignal.local</code>
                </li>
                <li>
                  Tap <span className="text-slate-300 font-medium">Save</span> to apply protection.
                </li>
              </ol>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs text-blue-400 leading-relaxed">
              💡 <span className="font-semibold">Note:</span> SafeSignal will now run in the background. If you change locations or network types, your protection remains active automatically.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
