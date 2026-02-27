'use client';

import React, { useState, useEffect } from 'react';

interface ClickStats {
  total_all_time: number;
  total_30_days: number;
  by_airline: { airline: string; count: number }[];
  top_routes: { route: string; count: number }[];
  recent: { id: number; created_at: string; airline: string; origin: string; destination: string; price: number }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<ClickStats | null>(null);
  const [error, setError] = useState('');
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState(false);

  const fetchStats = async (dashKey: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/go', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: dashKey }),
      });
      if (!res.ok) {
        setError(res.status === 401 ? 'Invalid key' : 'Failed to load stats');
        setAuthed(false);
        return;
      }
      const data = await res.json();
      setStats(data);
      setAuthed(true);
    } catch {
      setError('Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  // Check URL param for key
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlKey = params.get('key');
    if (urlKey) {
      setKey(urlKey);
      fetchStats(urlKey);
    }
  }, []);

  const C = {
    bg: '#FFFCF2', black: '#1A1A1A', green: '#0A3D2E', cream: '#FFFDF5',
    g100: '#F5F3ED', g200: '#E8E4DA', g400: '#A09A8C', g600: '#6B6558',
    pink: '#E8345A',
  };

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '40px', maxWidth: '400px', width: '90%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>ð</div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: C.black, margin: '0 0 6px' }}>Aviato Dashboard</h1>
          <p style={{ fontSize: '13px', color: C.g400, margin: '0 0 24px' }}>Enter your admin key to view click analytics</p>
          <input
            type="password"
            value={key}
            onChange={e => setKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchStats(key)}
            placeholder="Dashboard key"
            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1.5px solid ${C.g200}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', marginBottom: '12px' }}
          />
          <button onClick={() => fetchStats(key)} disabled={loading}
            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: C.black, color: C.cream, fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
            {loading ? 'Loading...' : 'View Dashboard'}
          </button>
          {error && <p style={{ color: C.pink, fontSize: '13px', marginTop: '12px' }}>{error}</p>}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // Calculate estimated revenue per airline at $1.50 CPC
  const CPC_RATE = 1.50;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', padding: '32px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: C.black, margin: '0 0 4px' }}>Aviato Click Dashboard</h1>
          <p style={{ fontSize: '13px', color: C.g400, margin: 0 }}>CPC tracking for outbound booking clicks</p>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', border: `1px solid ${C.g200}` }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: C.g400, letterSpacing: '0.06em', marginBottom: '8px' }}>TOTAL CLICKS (ALL TIME)</div>
            <div style={{ fontSize: '36px', fontWeight: 800, color: C.black }}>{stats.total_all_time}</div>
          </div>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', border: `1px solid ${C.g200}` }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: C.g400, letterSpacing: '0.06em', marginBottom: '8px' }}>CLICKS (LAST 30 DAYS)</div>
            <div style={{ fontSize: '36px', fontWeight: 800, color: C.black }}>{stats.total_30_days}</div>
          </div>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', border: `1px solid ${C.g200}` }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: C.g400, letterSpacing: '0.06em', marginBottom: '8px' }}>EST. REVENUE @ ${CPC_RATE}/CLICK</div>
            <div style={{ fontSize: '36px', fontWeight: 800, color: C.green }}>${(stats.total_30_days * CPC_RATE).toFixed(2)}</div>
          </div>
        </div>

        {/* Clicks by Airline */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', border: `1px solid ${C.g200}` }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: C.black, margin: '0 0 16px' }}>Clicks by Airline</h2>
            {stats.by_airline.length === 0 ? (
              <p style={{ fontSize: '13px', color: C.g400 }}>No clicks yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {stats.by_airline.map(a => {
                  const maxCount = stats.by_airline[0]?.count || 1;
                  return (
                    <div key={a.airline}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: C.black }}>{a.airline}</span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: C.green }}>{a.count} clicks Â· ${(a.count * CPC_RATE).toFixed(2)}</span>
                      </div>
                      <div style={{ height: '6px', backgroundColor: C.g100, borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(a.count / maxCount) * 100}%`, backgroundColor: C.green, borderRadius: '3px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', border: `1px solid ${C.g200}` }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: C.black, margin: '0 0 16px' }}>Top Routes</h2>
            {stats.top_routes.length === 0 ? (
              <p style={{ fontSize: '13px', color: C.g400 }}>No clicks yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {stats.top_routes.slice(0, 10).map(r => (
                  <div key={r.route} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: C.g100, borderRadius: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: C.black }}>{r.route}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: C.green }}>{r.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent clicks */}
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', border: `1px solid ${C.g200}` }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: C.black, margin: '0 0 16px' }}>Recent Clicks</h2>
          {stats.recent.length === 0 ? (
            <p style={{ fontSize: '13px', color: C.g400 }}>No clicks recorded yet. Clicks will appear here once users start booking through Aviato.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.g200}` }}>
                    <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 700, color: C.g400, fontSize: '11px', letterSpacing: '0.04em' }}>TIME</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 700, color: C.g400, fontSize: '11px', letterSpacing: '0.04em' }}>AIRLINE</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 700, color: C.g400, fontSize: '11px', letterSpacing: '0.04em' }}>ROUTE</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 700, color: C.g400, fontSize: '11px', letterSpacing: '0.04em' }}>PRICE</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent.map(c => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${C.g100}` }}>
                      <td style={{ padding: '10px 12px', color: C.g600 }}>{new Date(c.created_at).toLocaleString()}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: C.black }}>{c.airline}</td>
                      <td style={{ padding: '10px 12px', color: C.black }}>{c.origin} â {c.destination}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: C.green }}>${c.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Refresh button */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button onClick={() => fetchStats(key)}
            style={{ padding: '10px 24px', borderRadius: '10px', border: `1.5px solid ${C.g200}`, backgroundColor: 'transparent', color: C.g600, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}
