import type { Flight } from './types';
import { expandCode } from './locations';

export const FLIGHTS: Record<string, Flight[]> = {
  // JSX BUR↔LAS: Real schedule from Google Flights (daily, ERJ-135)
  'BUR-LAS': [
    { id:'jsx-b1', airline:'JSX', dep:'7:00 AM', arr:'8:10 AM', dc:'BUR', ac:'LAS', dur:'1h 10m', price:229, craft:'ERJ-135', seats:9, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-b2', airline:'JSX', dep:'10:20 AM', arr:'11:30 AM', dc:'BUR', ac:'LAS', dur:'1h 10m', price:229, craft:'ERJ-135', seats:6, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-b3', airline:'JSX', dep:'1:50 PM', arr:'3:00 PM', dc:'BUR', ac:'LAS', dur:'1h 10m', price:229, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-b4', airline:'JSX', dep:'4:30 PM', arr:'5:40 PM', dc:'BUR', ac:'LAS', dur:'1h 10m', price:229, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-b5', airline:'JSX', dep:'5:10 PM', arr:'6:20 PM', dc:'BUR', ac:'LAS', dur:'1h 10m', price:229, craft:'ERJ-135', seats:4, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],
  'LAS-BUR': [
    { id:'jsx-b6', airline:'JSX', dep:'8:40 AM', arr:'9:50 AM', dc:'LAS', ac:'BUR', dur:'1h 10m', price:269, craft:'ERJ-135', seats:8, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-b7', airline:'JSX', dep:'12:00 PM', arr:'1:10 PM', dc:'LAS', ac:'BUR', dur:'1h 10m', price:269, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-b8', airline:'JSX', dep:'2:50 PM', arr:'4:00 PM', dc:'LAS', ac:'BUR', dur:'1h 10m', price:269, craft:'ERJ-135', seats:6, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-b9', airline:'JSX', dep:'3:30 PM', arr:'4:40 PM', dc:'LAS', ac:'BUR', dur:'1h 10m', price:269, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-b10', airline:'JSX', dep:'6:45 PM', arr:'7:55 PM', dc:'LAS', ac:'BUR', dur:'1h 10m', price:269, craft:'ERJ-135', seats:3, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],
  // JSX SMO↔LAS: Real schedule from jsx.com (daily, ATR 42)
  'SMO-LAS': [
    { id:'jsx-s1', airline:'JSX', dep:'11:10 AM', arr:'12:25 PM', dc:'SMO', ac:'LAS', dur:'1h 15m', price:235, craft:'ATR 42', seats:7, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-s2', airline:'JSX', dep:'3:30 PM', arr:'4:45 PM', dc:'SMO', ac:'LAS', dur:'1h 15m', price:235, craft:'ATR 42', seats:6, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-s3', airline:'JSX', dep:'5:00 PM', arr:'6:15 PM', dc:'SMO', ac:'LAS', dur:'1h 15m', price:235, craft:'ATR 42', seats:5, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],
  // JSX LAS→SMO: Real schedule from Google Flights (daily, ATR 42)
  'LAS-SMO': [
    { id:'jsx-ls1', airline:'JSX', dep:'1:00 PM', arr:'2:15 PM', dc:'LAS', ac:'SMO', dur:'1h 15m', price:229, craft:'ATR 42', seats:6, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-ls2', airline:'JSX', dep:'7:00 PM', arr:'8:15 PM', dc:'LAS', ac:'SMO', dur:'1h 15m', price:229, craft:'ATR 42', seats:5, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],
  'VNY-LAS': [
    { id:'aero-v1', airline:'Aero', dep:'4:00 PM', arr:'5:05 PM', dc:'VNY', ac:'LAS', dur:'1h 05m', price:777, craft:'ERJ-135', seats:4, amen:['WiFi','Gourmet Catering','Champagne'], link:'aero.com' },
    { id:'aero-v2', airline:'Aero', dep:'5:30 PM', arr:'6:35 PM', dc:'VNY', ac:'LAS', dur:'1h 05m', price:777, craft:'ERJ-135', seats:4, amen:['WiFi','Gourmet Catering','Champagne'], link:'aero.com' },
  ],
  'LAS-VNY': [
    { id:'aero-v3', airline:'Aero', dep:'5:55 PM', arr:'7:00 PM', dc:'LAS', ac:'VNY', dur:'1h 05m', price:777, craft:'ERJ-135', seats:4, amen:['WiFi','Gourmet Catering','Champagne'], link:'aero.com' },
    { id:'aero-v4', airline:'Aero', dep:'7:15 PM', arr:'8:20 PM', dc:'LAS', ac:'VNY', dur:'1h 05m', price:777, craft:'ERJ-135', seats:4, amen:['WiFi','Gourmet Catering','Champagne'], link:'aero.com' },
  ],
  // Aero VNY↔ASE: Real schedule from aero.com (seasonal, Feb–Sep 2026)
  // NOTE: ASE (Aspen/Pitkin County Airport) closed Apr 23 – May 21, 2026 for pavement maintenance
  'VNY-ASE': [
    { id:'aero-a1', airline:'Aero', dep:'8:30 AM', arr:'11:40 AM', dc:'VNY', ac:'ASE', dur:'2h 10m', price:1950, craft:'ERJ-135', seats:4, amen:['WiFi','Gourmet Catering','Champagne'], link:'aero.com' },
  ],
  'ASE-VNY': [
    { id:'aero-a3', airline:'Aero', dep:'1:00 PM', arr:'2:20 PM', dc:'ASE', ac:'VNY', dur:'2h 20m', price:1950, craft:'ERJ-135', seats:4, amen:['WiFi','Gourmet Catering','Champagne'], link:'aero.com' },
  ],
  // Aero VNY↔APC (Napa): Real schedule from aero.com (seasonal, Apr 2026 only)
  'VNY-APC': [
    { id:'aero-n1', airline:'Aero', dep:'8:00 AM', arr:'9:20 AM', dc:'VNY', ac:'APC', dur:'1h 20m', price:1075, craft:'ERJ-135', seats:4, amen:['WiFi','Gourmet Catering','Wine Tasting Guide'], link:'aero.com' },
  ],
  'APC-VNY': [
    { id:'aero-n2', airline:'Aero', dep:'10:00 AM', arr:'11:15 AM', dc:'APC', ac:'VNY', dur:'1h 15m', price:975, craft:'ERJ-135', seats:4, amen:['WiFi','Gourmet Catering','Wine Tasting Guide'], link:'aero.com' },
  ],
  // Aero VNY↔SUN (Sun Valley): Real schedule from aero.com (seasonal, Feb–Apr 2026)
  'VNY-SUN': [
    { id:'aero-su1', airline:'Aero', dep:'3:20 PM', arr:'6:20 PM', dc:'VNY', ac:'SUN', dur:'2h 0m', price:2175, craft:'ERJ-135', seats:4, amen:['WiFi','Gourmet Catering','Champagne'], link:'aero.com' },
  ],
  'SUN-VNY': [
    { id:'aero-su2', airline:'Aero', dep:'7:10 PM', arr:'8:20 PM', dc:'SUN', ac:'VNY', dur:'2h 10m', price:2175, craft:'ERJ-135', seats:4, amen:['WiFi','Gourmet Catering','Champagne'], link:'aero.com' },
  ],
  // JSX SMO↔SCF: Corrected schedule (daily, ATR 42 — SMO uses turboprops for short runway)
  'SMO-SCF': [
    { id:'jsx-sc1', airline:'JSX', dep:'7:00 AM', arr:'9:40 AM', dc:'SMO', ac:'SCF', dur:'1h 40m', price:279, craft:'ATR 42', seats:7, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-sc2', airline:'JSX', dep:'12:30 PM', arr:'3:10 PM', dc:'SMO', ac:'SCF', dur:'1h 40m', price:279, craft:'ATR 42', seats:5, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-sc3', airline:'JSX', dep:'5:30 PM', arr:'8:10 PM', dc:'SMO', ac:'SCF', dur:'1h 40m', price:279, craft:'ATR 42', seats:4, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],
  'SCF-SMO': [
    { id:'jsx-sc4', airline:'JSX', dep:'7:00 AM', arr:'7:40 AM', dc:'SCF', ac:'SMO', dur:'1h 40m', price:279, craft:'ATR 42', seats:6, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-sc5', airline:'JSX', dep:'12:30 PM', arr:'1:10 PM', dc:'SCF', ac:'SMO', dur:'1h 40m', price:279, craft:'ATR 42', seats:5, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-sc6', airline:'JSX', dep:'5:30 PM', arr:'6:10 PM', dc:'SCF', ac:'SMO', dur:'1h 40m', price:279, craft:'ATR 42', seats:3, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],
  // NY ↔ SOUTH FLORIDA (heavy competition)
  'HPN-PBI': [
    { id:'jsx-hp1', airline:'JSX', dep:'7:00 AM', arr:'10:00 AM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:449, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
    { id:'jsx-hp2', airline:'JSX', dep:'4:30 PM', arr:'7:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:449, craft:'ERJ-135', seats:3, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
      { id:'slate-hpnpbi-1', airline:'Slate', dep:'3:30 PM', arr:'6:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2480, craft:'CRJ-200', seats:9, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-13' },
    { id:'slate-hpnpbi-2', airline:'Slate', dep:'9:30 AM', arr:'12:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2090, craft:'CRJ-200', seats:13, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-17' },
    { id:'slate-hpnpbi-3', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:13, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-18' },
    { id:'slate-hpnpbi-4', airline:'Slate', dep:'9:30 AM', arr:'12:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:14, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-19' },
    { id:'slate-hpnpbi-5', airline:'Slate', dep:'3:30 PM', arr:'6:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2090, craft:'CRJ-200', seats:14, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-20' },
    { id:'slate-hpnpbi-6', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:16, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-23' },
    { id:'slate-hpnpbi-7', airline:'Slate', dep:'9:30 AM', arr:'12:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2790, craft:'CRJ-200', seats:11, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-24' },
    { id:'slate-hpnpbi-8', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:13, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-25' },
    { id:'slate-hpnpbi-9', airline:'Slate', dep:'9:30 AM', arr:'12:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:12, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-26' },
    { id:'slate-hpnpbi-10', airline:'Slate', dep:'3:30 PM', arr:'6:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:16, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-27' },
    { id:'slate-hpnpbi-11', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:15, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-01' },
    { id:'slate-hpnpbi-12', airline:'Slate', dep:'11:30 AM', arr:'2:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2990, craft:'CRJ-200', seats:10, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-04' },
    { id:'slate-hpnpbi-13', airline:'Slate', dep:'9:30 AM', arr:'12:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:15, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-05' },
    { id:'slate-hpnpbi-14', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:14, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-08' },
    { id:'slate-hpnpbi-15', airline:'Slate', dep:'11:30 AM', arr:'2:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:16, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-11' },
    { id:'slate-hpnpbi-16', airline:'Slate', dep:'9:30 AM', arr:'12:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:16, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-12' },
    { id:'slate-hpnpbi-17', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:18, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-15' },
    { id:'slate-hpnpbi-18', airline:'Slate', dep:'11:30 AM', arr:'2:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:3490, craft:'CRJ-200', seats:4, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-18' },
    { id:'slate-hpnpbi-19', airline:'Slate', dep:'9:30 AM', arr:'12:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-19' },
    { id:'slate-hpnpbi-20', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-22' },
    { id:'slate-hpnpbi-21', airline:'Slate', dep:'11:30 AM', arr:'2:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:3290, craft:'CRJ-200', seats:1, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-25' },
    { id:'slate-hpnpbi-22', airline:'Slate', dep:'9:30 AM', arr:'12:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-26' },
    { id:'slate-hpnpbi-23', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-29' },
    { id:'slate-hpnpbi-24', airline:'Slate', dep:'11:30 AM', arr:'2:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-01' },
    { id:'slate-hpnpbi-25', airline:'Slate', dep:'9:30 AM', arr:'12:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2990, craft:'CRJ-200', seats:3, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-02' },
    { id:'slate-hpnpbi-26', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:7, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-05' },
    { id:'slate-hpnpbi-27', airline:'Slate', dep:'11:30 AM', arr:'2:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2090, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-08' },
    { id:'slate-hpnpbi-28', airline:'Slate', dep:'9:30 AM', arr:'12:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:3090, craft:'CRJ-200', seats:4, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-09' },
    { id:'slate-hpnpbi-29', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2790, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-12' },
    { id:'slate-hpnpbi-30', airline:'Slate', dep:'11:30 AM', arr:'2:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-15' },
    { id:'slate-hpnpbi-31', airline:'Slate', dep:'9:30 AM', arr:'12:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2790, craft:'CRJ-200', seats:7, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-16' },
    { id:'slate-hpnpbi-32', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-19' },
    { id:'slate-hpnpbi-33', airline:'Slate', dep:'11:30 AM', arr:'2:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-22' },
    { id:'slate-hpnpbi-34', airline:'Slate', dep:'9:30 AM', arr:'12:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2690, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-23' },
    { id:'slate-hpnpbi-35', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2690, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-26' },
    { id:'slate-hpnpbi-36', airline:'Slate', dep:'11:30 AM', arr:'2:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-29' },
    { id:'slate-hpnpbi-37', airline:'Slate', dep:'9:30 AM', arr:'12:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:3090, craft:'CRJ-200', seats:5, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-30' },
    { id:'slate-hpnpbi-38', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-03' },
    { id:'slate-hpnpbi-39', airline:'Slate', dep:'11:30 AM', arr:'2:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-06' },
    { id:'slate-hpnpbi-40', airline:'Slate', dep:'9:30 AM', arr:'12:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-07' },
    { id:'slate-hpnpbi-41', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-10' },
    { id:'slate-hpnpbi-42', airline:'Slate', dep:'11:30 AM', arr:'2:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-13' },
    { id:'slate-hpnpbi-43', airline:'Slate', dep:'9:30 AM', arr:'12:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2090, craft:'CRJ-200', seats:7, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-14' },
    { id:'slate-hpnpbi-44', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-17' },
    { id:'slate-hpnpbi-45', airline:'Slate', dep:'11:30 AM', arr:'2:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-20' },
    { id:'slate-hpnpbi-46', airline:'Slate', dep:'9:30 AM', arr:'12:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-21' },
    { id:'slate-hpnpbi-47', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-24' },
    { id:'slate-hpnpbi-48', airline:'Slate', dep:'11:30 AM', arr:'2:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-27' },
    { id:'slate-hpnpbi-49', airline:'Slate', dep:'9:30 AM', arr:'12:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-28' },
    { id:'slate-hpnpbi-50', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'HPN', ac:'PBI', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-31' },
  ],
  'PBI-HPN': [
    { id:'jsx-ph1', airline:'JSX', dep:'7:00 AM', arr:'10:00 AM', dc:'PBI', ac:'HPN', dur:'3h 00m', price:449, craft:'ERJ-135', seats:6, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
    { id:'jsx-ph2', airline:'JSX', dep:'4:30 PM', arr:'7:30 PM', dc:'PBI', ac:'HPN', dur:'3h 00m', price:449, craft:'ERJ-135', seats:3, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
      { id:'slate-pbihpn-1', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'PBI', ac:'HPN', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:9, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-13' },
    { id:'slate-pbihpn-2', airline:'Slate', dep:'3:30 PM', arr:'6:30 PM', dc:'PBI', ac:'HPN', dur:'3h 00m', price:3990, craft:'CRJ-200', seats:1, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-16' },
    { id:'slate-pbihpn-3', airline:'Slate', dep:'1:30 PM', arr:'4:30 PM', dc:'PBI', ac:'HPN', dur:'3h 00m', price:3190, craft:'CRJ-200', seats:7, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-17' },
    { id:'slate-pbihpn-4', airline:'Slate', dep:'2:30 PM', arr:'5:30 PM', dc:'PBI', ac:'HPN', dur:'3h 00m', price:2790, craft:'CRJ-200', seats:7, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-18' },
    { id:'slate-pbihpn-5', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'PBI', ac:'HPN', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:13, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-20' },
    { id:'slate-pbihpn-6', airline:'Slate', dep:'3:30 PM', arr:'6:30 PM', dc:'PBI', ac:'HPN', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:14, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-23' },
    { id:'slate-pbihpn-7', airline:'Slate', dep:'1:30 PM', arr:'4:30 PM', dc:'PBI', ac:'HPN', dur:'3h 00m', price:2990, craft:'CRJ-200', seats:9, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-24' },
    { id:'slate-pbihpn-8', airline:'Slate', dep:'2:30 PM', arr:'5:30 PM', dc:'PBI', ac:'HPN', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:12, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-25' },
    { id:'slate-pbihpn-9', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'PBI', ac:'HPN', dur:'3h 00m', price:3390, craft:'CRJ-200', seats:7, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-27' },
    { id:'slate-pbihpn-10', airline:'Slate', dep:'12:30 PM', arr:'3:30 PM', dc:'PBI', ac:'HPN', dur:'3h 00m', price:3190, craft:'CRJ-200', seats:9, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-01' },
    { id:'slate-pbihpn-11', airline:'Slate', dep:'1:30 PM', arr:'4:30 PM', dc:'PBI', ac:'HPN', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:16, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-03' },
    { id:'slate-pbihpn-12', airline:'Slate', dep:'12:30 PM', arr:'3:30 PM', dc:'PBI', ac:'HPN', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:13, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-08' },
    { id:'slate-pbihpn-13', airline:'Slate', dep:'1:30 PM', arr:'4:30 PM', dc:'PBI', ac:'HPN', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:16, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-10' },
    { id:'slate-pbihpn-14', airline:'Slate', dep:'12:30 PM', arr:'3:30 PM', dc:'PBI', ac:'HPN', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:16, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-15' },
    { id:'slate-pbihpn-15', airline:'Slate', dep:'1:30 PM', arr:'4:30 PM', dc:'PBI', ac:'HPN', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:4, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-17' },
    { id:'slate-pbihpn-16', airline:'Slate', dep:'12:30 PM', arr:'3:30 PM', dc:'PBI', ac:'HPN', dur:'3h 00m', price:2860, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-22' },
    { id:'slate-pbihpn-17', airline:'Slate', dep:'1:30 PM', arr:'4:30 PM', dc:'PBI', ac:'HPN', dur:'3h 00m', price:2890, craft:'CRJ-200', seats:4, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-24' },
    { id:'slate-pbihpn-18', airline:'Slate', dep:'12:30 PM', arr:'3:30 PM', dc:'PBI', ac:'HPN', dur:'3h 00m', price:3390, craft:'CRJ-200', seats:2, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-29' },
    { id:'slate-pbihpn-19', airline:'Slate', dep:'1:30 PM', arr:'4:30 PM', dc:'PBI', ac:'HPN', dur:'3h 00m', price:3090, craft:'CRJ-200', seats:4, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-31' },
    { id:'slate-pbihpn-20', airline:'Slate', dep:'12:30 PM', arr:'3:30 PM', dc:'PBI', ac:'HPN', dur:'3h 00m', price:4240, craft:'CRJ-200', seats:2, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-05' },
    { id:'slate-pbihpn-21', airline:'Slate', dep:'1:30 PM', arr:'4:30 PM', dc:'PBI', ac:'HPN', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-07' },
    { id:'slate-pbihpn-22', airline:'Slate', dep:'12:30 PM', arr:'3:30 PM', dc:'PBI', ac:'HPN', dur:'3h 00m', price:2790, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-12' },
    { id:'slate-pbihpn-23', airline:'Slate', dep:'1:30 PM', arr:'4:30 PM', dc:'PBI', ac:'HPN', dur:'3h 00m', price:3290, craft:'CRJ-200', seats:5, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-14' },
    { id:'slate-pbihpn-24', airline:'Slate', dep:'12:30 PM', arr:'3:30 PM', dc:'PBI', ac:'HPN', dur:'3h 00m', price:4240, craft:'CRJ-200', seats:3, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-19' },
    { id:'slate-pbihpn-25', airline:'Slate', dep:'1:30 PM', arr:'4:30 PM', dc:'PBI', ac:'HPN', dur:'3h 00m', price:2790, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-21' },
    { id:'slate-pbihpn-26', airline:'Slate', dep:'12:30 PM', arr:'3:30 PM', dc:'PBI', ac:'HPN', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-26' },
    { id:'slate-pbihpn-27', airline:'Slate', dep:'1:30 PM', arr:'4:30 PM', dc:'PBI', ac:'HPN', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-28' },
    { id:'slate-pbihpn-28', airline:'Slate', dep:'12:30 PM', arr:'3:30 PM', dc:'PBI', ac:'HPN', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-03' },
    { id:'slate-pbihpn-29', airline:'Slate', dep:'1:30 PM', arr:'4:30 PM', dc:'PBI', ac:'HPN', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-05' },
  ],
  'TEB-FLL': [
    { id:'slate-tebfll-1', airline:'Slate', dep:'9:30 AM', arr:'12:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2460, craft:'CRJ-200', seats:9, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-13' },
    { id:'slate-tebfll-2', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:14, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-19' },
    { id:'slate-tebfll-3', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:15, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-02' },
    { id:'slate-tebfll-4', airline:'Slate', dep:'3:30 PM', arr:'6:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:14, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-03' },
    { id:'slate-tebfll-5', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:16, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-04' },
    { id:'slate-tebfll-6', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:14, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-06' },
    { id:'slate-tebfll-7', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:18, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-09' },
    { id:'slate-tebfll-8', airline:'Slate', dep:'3:30 PM', arr:'6:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:16, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-10' },
    { id:'slate-tebfll-9', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:15, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-11' },
    { id:'slate-tebfll-10', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:18, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-13' },
    { id:'slate-tebfll-11', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:7, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-16' },
    { id:'slate-tebfll-12', airline:'Slate', dep:'3:30 PM', arr:'6:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-17' },
    { id:'slate-tebfll-13', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2690, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-18' },
    { id:'slate-tebfll-14', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:7, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-20' },
    { id:'slate-tebfll-15', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-23' },
    { id:'slate-tebfll-16', airline:'Slate', dep:'3:30 PM', arr:'6:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-24' },
    { id:'slate-tebfll-17', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-25' },
    { id:'slate-tebfll-18', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:3090, craft:'CRJ-200', seats:3, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-27' },
    { id:'slate-tebfll-19', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2690, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-30' },
    { id:'slate-tebfll-20', airline:'Slate', dep:'3:30 PM', arr:'6:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:3590, craft:'CRJ-200', seats:3, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-31' },
    { id:'slate-tebfll-21', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:3190, craft:'CRJ-200', seats:4, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-01' },
    { id:'slate-tebfll-22', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:5, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-03' },
    { id:'slate-tebfll-23', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-06' },
    { id:'slate-tebfll-24', airline:'Slate', dep:'3:30 PM', arr:'6:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2090, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-07' },
    { id:'slate-tebfll-25', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2090, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-08' },
    { id:'slate-tebfll-26', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2790, craft:'CRJ-200', seats:5, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-10' },
    { id:'slate-tebfll-27', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2790, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-13' },
    { id:'slate-tebfll-28', airline:'Slate', dep:'3:30 PM', arr:'6:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2690, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-14' },
    { id:'slate-tebfll-29', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-15' },
    { id:'slate-tebfll-30', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2690, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-17' },
    { id:'slate-tebfll-31', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-20' },
    { id:'slate-tebfll-32', airline:'Slate', dep:'3:30 PM', arr:'6:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-21' },
    { id:'slate-tebfll-33', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-22' },
    { id:'slate-tebfll-34', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-24' },
    { id:'slate-tebfll-35', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-27' },
    { id:'slate-tebfll-36', airline:'Slate', dep:'3:30 PM', arr:'6:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2090, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-28' },
    { id:'slate-tebfll-37', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-29' },
    { id:'slate-tebfll-38', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2890, craft:'CRJ-200', seats:7, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-01' },
    { id:'slate-tebfll-39', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-04' },
    { id:'slate-tebfll-40', airline:'Slate', dep:'3:30 PM', arr:'6:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-05' },
    { id:'slate-tebfll-41', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-06' },
    { id:'slate-tebfll-42', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-08' },
    { id:'slate-tebfll-43', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-11' },
    { id:'slate-tebfll-44', airline:'Slate', dep:'3:30 PM', arr:'6:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-12' },
    { id:'slate-tebfll-45', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-13' },
    { id:'slate-tebfll-46', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-15' },
    { id:'slate-tebfll-47', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-18' },
    { id:'slate-tebfll-48', airline:'Slate', dep:'3:30 PM', arr:'6:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-19' },
    { id:'slate-tebfll-49', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-20' },
    { id:'slate-tebfll-50', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2790, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-22' },
    { id:'slate-tebfll-51', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-25' },
    { id:'slate-tebfll-52', airline:'Slate', dep:'3:30 PM', arr:'6:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-26' },
    { id:'slate-tebfll-53', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-27' },
    { id:'slate-tebfll-54', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'TEB', ac:'FLL', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-29' },
  ],
  'FLL-TEB': [
    { id:'slate-fllteb-1', airline:'Slate', dep:'2:30 PM', arr:'5:30 PM', dc:'FLL', ac:'TEB', dur:'3h 00m', price:2370, craft:'CRJ-200', seats:10, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-16' },
    { id:'slate-fllteb-2', airline:'Slate', dep:'3:00 PM', arr:'6:00 PM', dc:'FLL', ac:'TEB', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:14, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-19' },
    { id:'slate-fllteb-3', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'FLL', ac:'TEB', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:14, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-25' },
    { id:'slate-fllteb-4', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'FLL', ac:'TEB', dur:'3h 00m', price:2890, craft:'CRJ-200', seats:12, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-03' },
    { id:'slate-fllteb-5', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'FLL', ac:'TEB', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:18, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-04' },
    { id:'slate-fllteb-6', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'FLL', ac:'TEB', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:13, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-10' },
    { id:'slate-fllteb-7', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'FLL', ac:'TEB', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:18, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-11' },
    { id:'slate-fllteb-8', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'FLL', ac:'TEB', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-17' },
    { id:'slate-fllteb-9', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'FLL', ac:'TEB', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-18' },
    { id:'slate-fllteb-10', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'FLL', ac:'TEB', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:5, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-24' },
    { id:'slate-fllteb-11', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'FLL', ac:'TEB', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-25' },
    { id:'slate-fllteb-12', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'FLL', ac:'TEB', dur:'3h 00m', price:2370, craft:'CRJ-200', seats:10, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-31' },
    { id:'slate-fllteb-13', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'FLL', ac:'TEB', dur:'3h 00m', price:1890, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-01' },
    { id:'slate-fllteb-14', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'FLL', ac:'TEB', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:7, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-07' },
    { id:'slate-fllteb-15', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'FLL', ac:'TEB', dur:'3h 00m', price:2090, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-08' },
    { id:'slate-fllteb-16', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'FLL', ac:'TEB', dur:'3h 00m', price:2890, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-14' },
    { id:'slate-fllteb-17', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'FLL', ac:'TEB', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-15' },
    { id:'slate-fllteb-18', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'FLL', ac:'TEB', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-21' },
    { id:'slate-fllteb-19', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'FLL', ac:'TEB', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-22' },
    { id:'slate-fllteb-20', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'FLL', ac:'TEB', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-28' },
    { id:'slate-fllteb-21', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'FLL', ac:'TEB', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-29' },
    { id:'slate-fllteb-22', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'FLL', ac:'TEB', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-05' },
    { id:'slate-fllteb-23', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'FLL', ac:'TEB', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-06' },
  ],
  'HPN-OPF': [
    { id:'jsx-hm1', airline:'JSX', dep:'8:00 AM', arr:'11:05 AM', dc:'HPN', ac:'OPF', dur:'3h 05m', price:449, craft:'ERJ-135', seats:4, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
  ],
  'OPF-HPN': [
    { id:'jsx-mh1', airline:'JSX', dep:'8:00 AM', arr:'11:05 AM', dc:'OPF', ac:'HPN', dur:'3h 05m', price:449, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
  ],
  // NANTUCKET (Tradewind)
  'HPN-ACK': [
    { id:'tw-ha1', airline:'Tradewind', dep:'12:00 PM', arr:'1:10 PM', dc:'HPN', ac:'ACK', dur:'1h 10m', price:895, craft:'Pilatus PC-12', seats:3, amen:['WiFi','Snacks'], link:'flytradewind.com' },
  ],
  'ACK-HPN': [
    { id:'tw-ah1', airline:'Tradewind', dep:'3:00 PM', arr:'4:10 PM', dc:'ACK', ac:'HPN', dur:'1h 10m', price:895, craft:'Pilatus PC-12', seats:4, amen:['WiFi','Snacks'], link:'flytradewind.com' },
  ],
  // JSX DAL↔LAS: Corrected (daily, ERJ-135). DAL=CT, LAS=PT — local times shown
  'DAL-LAS': [
    { id:'jsx-dl1', airline:'JSX', dep:'7:00 AM', arr:'8:00 AM', dc:'DAL', ac:'LAS', dur:'3h 00m', price:399, craft:'ERJ-135', seats:6, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
    { id:'jsx-dl2', airline:'JSX', dep:'4:30 PM', arr:'5:30 PM', dc:'DAL', ac:'LAS', dur:'3h 00m', price:399, craft:'ERJ-135', seats:4, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
  ],
  'LAS-DAL': [
    { id:'jsx-ld1', airline:'JSX', dep:'7:00 AM', arr:'12:00 PM', dc:'LAS', ac:'DAL', dur:'3h 00m', price:399, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
    { id:'jsx-ld2', airline:'JSX', dep:'4:30 PM', arr:'9:30 PM', dc:'LAS', ac:'DAL', dur:'3h 00m', price:399, craft:'ERJ-135', seats:3, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
  ],
  'DAL-DSI': [
    { id:'jsx-dd1', airline:'JSX', dep:'8:00 AM', arr:'10:00 AM', dc:'DAL', ac:'DSI', dur:'2h 00m', price:229, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],
  'DSI-DAL': [
    { id:'jsx-dd2', airline:'JSX', dep:'4:00 PM', arr:'6:00 PM', dc:'DSI', ac:'DAL', dur:'2h 00m', price:229, craft:'ERJ-135', seats:6, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],
  'FLL-NAS': [
    { id:'tw-fn1', airline:'Tradewind', dep:'9:00 AM', arr:'10:00 AM', dc:'FLL', ac:'NAS', dur:'1h 00m', price:295, craft:'Pilatus PC-12', seats:4, amen:['WiFi','Snacks'], link:'flytradewind.com' },
    { id:'tw-fn2', airline:'Tradewind', dep:'2:00 PM', arr:'3:00 PM', dc:'FLL', ac:'NAS', dur:'1h 00m', price:295, craft:'Pilatus PC-12', seats:3, amen:['WiFi','Snacks'], link:'flytradewind.com' },
  ],
  'NAS-FLL': [
    { id:'tw-nf1', airline:'Tradewind', dep:'11:00 AM', arr:'12:00 PM', dc:'NAS', ac:'FLL', dur:'1h 00m', price:295, craft:'Pilatus PC-12', seats:5, amen:['WiFi','Snacks'], link:'flytradewind.com' },
  ],
  // MARTHA'S VINEYARD (Tradewind)
  'HPN-MVY': [
    { id:'tw-hm1', airline:'Tradewind', dep:'9:00 AM', arr:'10:10 AM', dc:'HPN', ac:'MVY', dur:'1h 10m', price:895, craft:'Pilatus PC-12', seats:4, amen:['WiFi','Snacks'], link:'flytradewind.com' },
    { id:'tw-hm2', airline:'Tradewind', dep:'2:00 PM', arr:'3:10 PM', dc:'HPN', ac:'MVY', dur:'1h 10m', price:895, craft:'Pilatus PC-12', seats:3, amen:['WiFi','Snacks'], link:'flytradewind.com' },
  ],
  'MVY-HPN': [
    { id:'tw-mh1', airline:'Tradewind', dep:'11:00 AM', arr:'12:10 PM', dc:'MVY', ac:'HPN', dur:'1h 10m', price:895, craft:'Pilatus PC-12', seats:5, amen:['WiFi','Snacks'], link:'flytradewind.com' },
    { id:'tw-mh2', airline:'Tradewind', dep:'4:00 PM', arr:'5:10 PM', dc:'MVY', ac:'HPN', dur:'1h 10m', price:895, craft:'Pilatus PC-12', seats:4, amen:['WiFi','Snacks'], link:'flytradewind.com' },
  ],
  // BARK AIR — Dog-Friendly Luxury (each ticket = 1 dog + 1 human)
  'VNY-HPN': [
    { id:'bark-vh1', airline:'BARK Air', dep:'9:00 AM', arr:'5:30 PM', dc:'VNY', ac:'HPN', dur:'5h 30m', price:6000, craft:'Gulfstream GIV', seats:8, amen:['WiFi','Gourmet Catering','Champagne','Vet Tech On Board'], link:'air.bark.co' },
  ],
  'HPN-VNY': [
    { id:'bark-hv1', airline:'BARK Air', dep:'10:00 AM', arr:'1:30 PM', dc:'HPN', ac:'VNY', dur:'5h 30m', price:6000, craft:'Gulfstream GIV', seats:8, amen:['WiFi','Gourmet Catering','Champagne','Vet Tech On Board'], link:'air.bark.co' },
  ],
  'SJC-HPN': [
    { id:'bark-sh1', airline:'BARK Air', dep:'9:00 AM', arr:'5:45 PM', dc:'SJC', ac:'HPN', dur:'5h 45m', price:7100, craft:'Bombardier Challenger 601', seats:8, amen:['WiFi','Gourmet Catering','Champagne','Vet Tech On Board'], link:'air.bark.co' },
  ],
  'HPN-SJC': [
    { id:'bark-hs1', airline:'BARK Air', dep:'10:00 AM', arr:'1:45 PM', dc:'HPN', ac:'SJC', dur:'5h 45m', price:7100, craft:'Bombardier Challenger 601', seats:8, amen:['WiFi','Gourmet Catering','Champagne','Vet Tech On Board'], link:'air.bark.co' },
  ],
  'FXE-HPN': [
    { id:'bark-fh1', airline:'BARK Air', dep:'10:00 AM', arr:'1:15 PM', dc:'FXE', ac:'HPN', dur:'3h 15m', price:950, craft:'CRJ-200', seats:16, amen:['WiFi','Snacks','Calming Treats','Vet Tech On Board'], link:'air.bark.co' },
  ],
  'HPN-FXE': [
    { id:'bark-hf1', airline:'BARK Air', dep:'9:00 AM', arr:'12:15 PM', dc:'HPN', ac:'FXE', dur:'3h 15m', price:950, craft:'CRJ-200', seats:16, amen:['WiFi','Snacks','Calming Treats','Vet Tech On Board'], link:'air.bark.co' },
  ],
  'VNY-KOA': [
    { id:'bark-vk1', airline:'BARK Air', dep:'8:00 AM', arr:'12:30 PM', dc:'VNY', ac:'KOA', dur:'5h 30m', price:7500, craft:'Gulfstream GIV', seats:8, amen:['WiFi','Gourmet Catering','Champagne','Vet Tech On Board'], link:'air.bark.co' },
  ],
  'KOA-VNY': [
    { id:'bark-kv1', airline:'BARK Air', dep:'10:00 AM', arr:'5:30 PM', dc:'KOA', ac:'VNY', dur:'5h 30m', price:7500, craft:'Gulfstream GIV', seats:8, amen:['WiFi','Gourmet Catering','Champagne','Vet Tech On Board'], link:'air.bark.co' },
  ],
  // BAY AREA
  'BUR-CCR': [
    { id:'jsx-bc1', airline:'JSX', dep:'7:00 AM', arr:'8:25 AM', dc:'BUR', ac:'CCR', dur:'1h 25m', price:245, craft:'ERJ-135', seats:6, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-bc2', airline:'JSX', dep:'4:30 PM', arr:'5:55 PM', dc:'BUR', ac:'CCR', dur:'1h 25m', price:245, craft:'ERJ-135', seats:4, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],
  'CCR-BUR': [
    { id:'jsx-cb1', airline:'JSX', dep:'9:00 AM', arr:'10:25 AM', dc:'CCR', ac:'BUR', dur:'1h 25m', price:245, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-cb2', airline:'JSX', dep:'6:30 PM', arr:'7:55 PM', dc:'CCR', ac:'BUR', dur:'1h 25m', price:245, craft:'ERJ-135', seats:3, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],

  // ═══ JSX: Orange County (SNA) routes ═══
  // JSX SNA↔LAS: Real schedule from Google Flights (daily, ERJ-135)
  'SNA-LAS': [
    { id:'jsx-snl1', airline:'JSX', dep:'9:05 AM', arr:'10:20 AM', dc:'SNA', ac:'LAS', dur:'1h 15m', price:269, craft:'ERJ-135', seats:6, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-snl2', airline:'JSX', dep:'12:55 PM', arr:'2:10 PM', dc:'SNA', ac:'LAS', dur:'1h 15m', price:269, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-snl3', airline:'JSX', dep:'2:55 PM', arr:'4:10 PM', dc:'SNA', ac:'LAS', dur:'1h 15m', price:269, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-snl4', airline:'JSX', dep:'8:00 PM', arr:'9:15 PM', dc:'SNA', ac:'LAS', dur:'1h 15m', price:269, craft:'ERJ-135', seats:4, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],
  'LAS-SNA': [
    { id:'jsx-lsn1', airline:'JSX', dep:'7:30 AM', arr:'8:40 AM', dc:'LAS', ac:'SNA', dur:'1h 10m', price:330, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-lsn2', airline:'JSX', dep:'11:15 AM', arr:'12:25 PM', dc:'LAS', ac:'SNA', dur:'1h 10m', price:330, craft:'ERJ-135', seats:6, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-lsn3', airline:'JSX', dep:'1:15 PM', arr:'2:25 PM', dc:'LAS', ac:'SNA', dur:'1h 10m', price:330, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-lsn4', airline:'JSX', dep:'6:15 PM', arr:'7:25 PM', dc:'LAS', ac:'SNA', dur:'1h 10m', price:330, craft:'ERJ-135', seats:8, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],
  'SNA-SCF': [
    { id:'jsx-snsf1', airline:'JSX', dep:'7:00 AM', arr:'9:25 AM', dc:'SNA', ac:'SCF', dur:'1h 25m', price:279, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-snsf2', airline:'JSX', dep:'4:30 PM', arr:'6:55 PM', dc:'SNA', ac:'SCF', dur:'1h 25m', price:279, craft:'ERJ-135', seats:6, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],
  'SCF-SNA': [
    { id:'jsx-sfsn1', airline:'JSX', dep:'7:00 AM', arr:'7:25 AM', dc:'SCF', ac:'SNA', dur:'1h 25m', price:279, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-sfsn2', airline:'JSX', dep:'5:15 PM', arr:'5:40 PM', dc:'SCF', ac:'SNA', dur:'1h 25m', price:279, craft:'ERJ-135', seats:6, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],
  'SNA-OAK': [
    { id:'jsx-sno1', airline:'JSX', dep:'7:00 AM', arr:'8:30 AM', dc:'SNA', ac:'OAK', dur:'1h 30m', price:249, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-sno2', airline:'JSX', dep:'4:45 PM', arr:'6:15 PM', dc:'SNA', ac:'OAK', dur:'1h 30m', price:249, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],
  'OAK-SNA': [
    { id:'jsx-osn1', airline:'JSX', dep:'6:30 AM', arr:'8:00 AM', dc:'OAK', ac:'SNA', dur:'1h 30m', price:249, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-osn2', airline:'JSX', dep:'5:00 PM', arr:'6:30 PM', dc:'OAK', ac:'SNA', dur:'1h 30m', price:249, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],

  // ═══ JSX: Oakland (OAK) routes ═══
  'BUR-OAK': [
    { id:'jsx-bo1', airline:'JSX', dep:'7:15 AM', arr:'8:35 AM', dc:'BUR', ac:'OAK', dur:'1h 20m', price:249, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-bo2', airline:'JSX', dep:'12:45 PM', arr:'2:05 PM', dc:'BUR', ac:'OAK', dur:'1h 20m', price:249, craft:'ERJ-135', seats:6, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-bo3', airline:'JSX', dep:'5:00 PM', arr:'6:20 PM', dc:'BUR', ac:'OAK', dur:'1h 20m', price:249, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],
  'OAK-BUR': [
    { id:'jsx-ob1', airline:'JSX', dep:'6:45 AM', arr:'8:05 AM', dc:'OAK', ac:'BUR', dur:'1h 20m', price:239, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-ob2', airline:'JSX', dep:'1:30 PM', arr:'2:50 PM', dc:'OAK', ac:'BUR', dur:'1h 20m', price:239, craft:'ERJ-135', seats:6, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-ob3', airline:'JSX', dep:'5:30 PM', arr:'6:50 PM', dc:'OAK', ac:'BUR', dur:'1h 20m', price:239, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],
  'OAK-LAS': [
    { id:'jsx-ol1', airline:'JSX', dep:'7:15 AM', arr:'8:50 AM', dc:'OAK', ac:'LAS', dur:'1h 35m', price:249, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-ol2', airline:'JSX', dep:'1:00 PM', arr:'2:35 PM', dc:'OAK', ac:'LAS', dur:'1h 35m', price:249, craft:'ERJ-135', seats:6, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-ol3', airline:'JSX', dep:'5:30 PM', arr:'7:05 PM', dc:'OAK', ac:'LAS', dur:'1h 35m', price:249, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],
  'LAS-OAK': [
    { id:'jsx-lo1', airline:'JSX', dep:'6:15 AM', arr:'7:50 AM', dc:'LAS', ac:'OAK', dur:'1h 35m', price:249, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-lo2', airline:'JSX', dep:'2:30 PM', arr:'4:05 PM', dc:'LAS', ac:'OAK', dur:'1h 35m', price:249, craft:'ERJ-135', seats:6, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-lo3', airline:'JSX', dep:'5:30 PM', arr:'7:05 PM', dc:'LAS', ac:'OAK', dur:'1h 35m', price:249, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],
  'OAK-SCF': [
    { id:'jsx-osc1', airline:'JSX', dep:'7:00 AM', arr:'10:05 AM', dc:'OAK', ac:'SCF', dur:'2h 05m', price:349, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-osc2', airline:'JSX', dep:'4:30 PM', arr:'7:35 PM', dc:'OAK', ac:'SCF', dur:'2h 05m', price:349, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],
  'SCF-OAK': [
    { id:'jsx-sco1', airline:'JSX', dep:'7:00 AM', arr:'8:05 AM', dc:'SCF', ac:'OAK', dur:'2h 05m', price:349, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-sco2', airline:'JSX', dep:'4:30 PM', arr:'5:35 PM', dc:'SCF', ac:'OAK', dur:'2h 05m', price:349, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],

  // ═══ JSX: Denver (APA/Centennial — moved from BJC Sept 2025), Reno, Monterey ═══
  // NOTE: BUR-DEN service ended Jan 5, 2026. SNA-APA launched Jan 8, 2026 (4x weekly).
  'BUR-APA': [
    { id:'jsx-bbj1', airline:'JSX', dep:'7:00 AM', arr:'10:30 AM', dc:'BUR', ac:'APA', dur:'2h 30m', price:399, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-bbj2', airline:'JSX', dep:'4:30 PM', arr:'8:00 PM', dc:'BUR', ac:'APA', dur:'2h 30m', price:399, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],
  'APA-BUR': [
    { id:'jsx-bjb1', airline:'JSX', dep:'7:00 AM', arr:'8:30 AM', dc:'APA', ac:'BUR', dur:'2h 30m', price:399, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-bjb2', airline:'JSX', dep:'4:30 PM', arr:'6:00 PM', dc:'APA', ac:'BUR', dur:'2h 30m', price:399, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],
  'BUR-RNO': [
    { id:'jsx-brn1', airline:'JSX', dep:'7:30 AM', arr:'9:00 AM', dc:'BUR', ac:'RNO', dur:'1h 30m', price:249, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-brn2', airline:'JSX', dep:'4:30 PM', arr:'6:00 PM', dc:'BUR', ac:'RNO', dur:'1h 30m', price:249, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],
  'RNO-BUR': [
    { id:'jsx-rnb1', airline:'JSX', dep:'6:00 AM', arr:'7:30 AM', dc:'RNO', ac:'BUR', dur:'1h 30m', price:249, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-rnb2', airline:'JSX', dep:'5:00 PM', arr:'6:30 PM', dc:'RNO', ac:'BUR', dur:'1h 30m', price:249, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],
  'BUR-MRY': [
    { id:'jsx-bmy1', airline:'JSX', dep:'7:45 AM', arr:'9:00 AM', dc:'BUR', ac:'MRY', dur:'1h 15m', price:249, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-bmy2', airline:'JSX', dep:'4:30 PM', arr:'5:45 PM', dc:'BUR', ac:'MRY', dur:'1h 15m', price:249, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],
  'MRY-BUR': [
    { id:'jsx-myb1', airline:'JSX', dep:'6:30 AM', arr:'7:45 AM', dc:'MRY', ac:'BUR', dur:'1h 15m', price:249, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-myb2', airline:'JSX', dep:'5:00 PM', arr:'6:15 PM', dc:'MRY', ac:'BUR', dur:'1h 15m', price:249, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],

  // ═══ JSX: Texas routes ═══
  // JSX DAL↔HOU: Corrected (daily, ERJ-135). Research confirms starting at $199
  'DAL-HOU': [
    { id:'jsx-dh1', airline:'JSX', dep:'7:00 AM', arr:'8:10 AM', dc:'DAL', ac:'HOU', dur:'1h 10m', price:199, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-dh2', airline:'JSX', dep:'12:30 PM', arr:'1:40 PM', dc:'DAL', ac:'HOU', dur:'1h 10m', price:199, craft:'ERJ-135', seats:6, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-dh3', airline:'JSX', dep:'5:30 PM', arr:'6:40 PM', dc:'DAL', ac:'HOU', dur:'1h 10m', price:199, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],
  'HOU-DAL': [
    { id:'jsx-hd1', airline:'JSX', dep:'6:30 AM', arr:'7:40 AM', dc:'HOU', ac:'DAL', dur:'1h 10m', price:199, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-hd2', airline:'JSX', dep:'12:30 PM', arr:'1:40 PM', dc:'HOU', ac:'DAL', dur:'1h 10m', price:199, craft:'ERJ-135', seats:6, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-hd3', airline:'JSX', dep:'5:30 PM', arr:'6:40 PM', dc:'HOU', ac:'DAL', dur:'1h 10m', price:199, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],
  'DAL-EDC': [
    { id:'jsx-de1', airline:'JSX', dep:'7:30 AM', arr:'8:35 AM', dc:'DAL', ac:'EDC', dur:'1h 05m', price:199, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-de2', airline:'JSX', dep:'12:30 PM', arr:'1:35 PM', dc:'DAL', ac:'EDC', dur:'1h 05m', price:199, craft:'ERJ-135', seats:6, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-de3', airline:'JSX', dep:'5:30 PM', arr:'6:35 PM', dc:'DAL', ac:'EDC', dur:'1h 05m', price:199, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],
  'EDC-DAL': [
    { id:'jsx-ed1', airline:'JSX', dep:'6:45 AM', arr:'7:50 AM', dc:'EDC', ac:'DAL', dur:'1h 05m', price:199, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-ed2', airline:'JSX', dep:'12:30 PM', arr:'1:35 PM', dc:'EDC', ac:'DAL', dur:'1h 05m', price:199, craft:'ERJ-135', seats:6, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-ed3', airline:'JSX', dep:'5:30 PM', arr:'6:35 PM', dc:'EDC', ac:'DAL', dur:'1h 05m', price:199, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],
  'DAL-SCF': [
    { id:'jsx-dscf1', airline:'JSX', dep:'7:00 AM', arr:'8:35 AM', dc:'DAL', ac:'SCF', dur:'2h 35m', price:349, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-dscf2', airline:'JSX', dep:'4:30 PM', arr:'6:05 PM', dc:'DAL', ac:'SCF', dur:'2h 35m', price:349, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],
  'SCF-DAL': [
    { id:'jsx-scfd1', airline:'JSX', dep:'7:00 AM', arr:'10:35 AM', dc:'SCF', ac:'DAL', dur:'2h 35m', price:349, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-scfd2', airline:'JSX', dep:'4:30 PM', arr:'8:05 PM', dc:'SCF', ac:'DAL', dur:'2h 35m', price:349, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],
  // JSX DAL↔BUR: Corrected (daily, ERJ-135). DAL=CT, BUR=PT — local times shown
  'DAL-BUR': [
    { id:'jsx-dbu1', airline:'JSX', dep:'7:00 AM', arr:'8:20 AM', dc:'DAL', ac:'BUR', dur:'3h 20m', price:449, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
    { id:'jsx-dbu2', airline:'JSX', dep:'4:00 PM', arr:'5:20 PM', dc:'DAL', ac:'BUR', dur:'3h 20m', price:449, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
  ],
  'BUR-DAL': [
    { id:'jsx-bud1', airline:'JSX', dep:'7:00 AM', arr:'12:20 PM', dc:'BUR', ac:'DAL', dur:'3h 20m', price:449, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
    { id:'jsx-bud2', airline:'JSX', dep:'4:30 PM', arr:'9:50 PM', dc:'BUR', ac:'DAL', dur:'3h 20m', price:449, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
  ],

  // ═══ JSX: East Coast ↔ Dallas ═══
  'HPN-DAL': [
    { id:'jsx-hpd1', airline:'JSX', dep:'7:00 AM', arr:'9:40 AM', dc:'HPN', ac:'DAL', dur:'3h 40m', price:449, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
    { id:'jsx-hpd2', airline:'JSX', dep:'4:30 PM', arr:'7:10 PM', dc:'HPN', ac:'DAL', dur:'3h 40m', price:449, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
  ],
  'DAL-HPN': [
    { id:'jsx-dhp1', airline:'JSX', dep:'7:00 AM', arr:'11:40 AM', dc:'DAL', ac:'HPN', dur:'3h 40m', price:449, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
    { id:'jsx-dhp2', airline:'JSX', dep:'4:30 PM', arr:'9:10 PM', dc:'DAL', ac:'HPN', dur:'3h 40m', price:449, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
  ],

  // ═══ JSX: East Coast ↔ South Florida (new routes) ═══
  'HPN-FLL': [
    { id:'jsx-hfl1', airline:'JSX', dep:'7:00 AM', arr:'10:05 AM', dc:'HPN', ac:'FLL', dur:'3h 05m', price:449, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
    { id:'jsx-hfl2', airline:'JSX', dep:'4:30 PM', arr:'7:35 PM', dc:'HPN', ac:'FLL', dur:'3h 05m', price:449, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
      { id:'slate-hpnfll-1', airline:'Slate', dep:'12:30 PM', arr:'3:30 PM', dc:'HPN', ac:'FLL', dur:'3h 00m', price:2380, craft:'CRJ-200', seats:9, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-14' },
    { id:'slate-hpnfll-2', airline:'Slate', dep:'9:30 AM', arr:'12:30 PM', dc:'HPN', ac:'FLL', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:9, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-16' },
    { id:'slate-hpnfll-3', airline:'Slate', dep:'12:30 PM', arr:'3:30 PM', dc:'HPN', ac:'FLL', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:11, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-21' },
    { id:'slate-hpnfll-4', airline:'Slate', dep:'1:30 PM', arr:'4:30 PM', dc:'HPN', ac:'FLL', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:10, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-22' },
    { id:'slate-hpnfll-5', airline:'Slate', dep:'12:30 PM', arr:'3:30 PM', dc:'HPN', ac:'FLL', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:11, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-28' },
    { id:'slate-hpnfll-6', airline:'Slate', dep:'3:00 PM', arr:'6:00 PM', dc:'HPN', ac:'FLL', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:14, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-02' },
    { id:'slate-hpnfll-7', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'HPN', ac:'FLL', dur:'3h 00m', price:2890, craft:'CRJ-200', seats:11, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-07' },
    { id:'slate-hpnfll-8', airline:'Slate', dep:'3:00 PM', arr:'6:00 PM', dc:'HPN', ac:'FLL', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:15, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-09' },
    { id:'slate-hpnfll-9', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'HPN', ac:'FLL', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:18, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-14' },
    { id:'slate-hpnfll-10', airline:'Slate', dep:'3:00 PM', arr:'6:00 PM', dc:'HPN', ac:'FLL', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-16' },
    { id:'slate-hpnfll-11', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'HPN', ac:'FLL', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-21' },
    { id:'slate-hpnfll-12', airline:'Slate', dep:'3:00 PM', arr:'6:00 PM', dc:'HPN', ac:'FLL', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-23' },
    { id:'slate-hpnfll-13', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'HPN', ac:'FLL', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-28' },
    { id:'slate-hpnfll-14', airline:'Slate', dep:'3:00 PM', arr:'6:00 PM', dc:'HPN', ac:'FLL', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-30' },
    { id:'slate-hpnfll-15', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'HPN', ac:'FLL', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-04' },
    { id:'slate-hpnfll-16', airline:'Slate', dep:'3:00 PM', arr:'6:00 PM', dc:'HPN', ac:'FLL', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-06' },
    { id:'slate-hpnfll-17', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'HPN', ac:'FLL', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-11' },
    { id:'slate-hpnfll-18', airline:'Slate', dep:'3:00 PM', arr:'6:00 PM', dc:'HPN', ac:'FLL', dur:'3h 00m', price:2790, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-13' },
    { id:'slate-hpnfll-19', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'HPN', ac:'FLL', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-18' },
    { id:'slate-hpnfll-20', airline:'Slate', dep:'3:00 PM', arr:'6:00 PM', dc:'HPN', ac:'FLL', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-20' },
    { id:'slate-hpnfll-21', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'HPN', ac:'FLL', dur:'3h 00m', price:2090, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-25' },
    { id:'slate-hpnfll-22', airline:'Slate', dep:'3:00 PM', arr:'6:00 PM', dc:'HPN', ac:'FLL', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-27' },
    { id:'slate-hpnfll-23', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'HPN', ac:'FLL', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-02' },
    { id:'slate-hpnfll-24', airline:'Slate', dep:'3:00 PM', arr:'6:00 PM', dc:'HPN', ac:'FLL', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-04' },
    { id:'slate-hpnfll-25', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'HPN', ac:'FLL', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-09' },
    { id:'slate-hpnfll-26', airline:'Slate', dep:'3:00 PM', arr:'6:00 PM', dc:'HPN', ac:'FLL', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-11' },
    { id:'slate-hpnfll-27', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'HPN', ac:'FLL', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-16' },
    { id:'slate-hpnfll-28', airline:'Slate', dep:'3:00 PM', arr:'6:00 PM', dc:'HPN', ac:'FLL', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-18' },
    { id:'slate-hpnfll-29', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'HPN', ac:'FLL', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-23' },
    { id:'slate-hpnfll-30', airline:'Slate', dep:'3:00 PM', arr:'6:00 PM', dc:'HPN', ac:'FLL', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-25' },
    { id:'slate-hpnfll-31', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'HPN', ac:'FLL', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-30' },
  ],
  'FLL-HPN': [
    { id:'jsx-fhp1', airline:'JSX', dep:'7:00 AM', arr:'10:05 AM', dc:'FLL', ac:'HPN', dur:'3h 05m', price:449, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
    { id:'jsx-fhp2', airline:'JSX', dep:'4:30 PM', arr:'7:35 PM', dc:'FLL', ac:'HPN', dur:'3h 05m', price:449, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
      { id:'slate-fllhpn-1', airline:'Slate', dep:'2:30 PM', arr:'5:30 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:11, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-13' },
    { id:'slate-fllhpn-2', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:1790, craft:'CRJ-200', seats:16, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-14' },
    { id:'slate-fllhpn-3', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:2790, craft:'CRJ-200', seats:5, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-21' },
    { id:'slate-fllhpn-4', airline:'Slate', dep:'6:30 PM', arr:'9:30 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:3090, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-22' },
    { id:'slate-fllhpn-5', airline:'Slate', dep:'10:00 AM', arr:'1:00 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:14, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-02' },
    { id:'slate-fllhpn-6', airline:'Slate', dep:'2:30 PM', arr:'5:30 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:2990, craft:'CRJ-200', seats:12, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-04' },
    { id:'slate-fllhpn-7', airline:'Slate', dep:'12:30 PM', arr:'3:30 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:2690, craft:'CRJ-200', seats:17, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-07' },
    { id:'slate-fllhpn-8', airline:'Slate', dep:'10:00 AM', arr:'1:00 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:18, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-09' },
    { id:'slate-fllhpn-9', airline:'Slate', dep:'2:30 PM', arr:'5:30 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:2790, craft:'CRJ-200', seats:11, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-11' },
    { id:'slate-fllhpn-10', airline:'Slate', dep:'12:30 PM', arr:'3:30 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:14, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-14' },
    { id:'slate-fllhpn-11', airline:'Slate', dep:'10:00 AM', arr:'1:00 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-16' },
    { id:'slate-fllhpn-12', airline:'Slate', dep:'2:30 PM', arr:'5:30 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:7, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-18' },
    { id:'slate-fllhpn-13', airline:'Slate', dep:'12:30 PM', arr:'3:30 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:2090, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-21' },
    { id:'slate-fllhpn-14', airline:'Slate', dep:'10:00 AM', arr:'1:00 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-23' },
    { id:'slate-fllhpn-15', airline:'Slate', dep:'2:30 PM', arr:'5:30 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:2090, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-25' },
    { id:'slate-fllhpn-16', airline:'Slate', dep:'12:30 PM', arr:'3:30 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:2990, craft:'CRJ-200', seats:4, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-28' },
    { id:'slate-fllhpn-17', airline:'Slate', dep:'10:00 AM', arr:'1:00 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:3790, craft:'CRJ-200', seats:1, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-30' },
    { id:'slate-fllhpn-18', airline:'Slate', dep:'2:30 PM', arr:'5:30 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:1890, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-01' },
    { id:'slate-fllhpn-19', airline:'Slate', dep:'12:30 PM', arr:'3:30 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-04' },
    { id:'slate-fllhpn-20', airline:'Slate', dep:'10:00 AM', arr:'1:00 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:2520, craft:'CRJ-200', seats:9, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-06' },
    { id:'slate-fllhpn-21', airline:'Slate', dep:'2:30 PM', arr:'5:30 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:2090, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-08' },
    { id:'slate-fllhpn-22', airline:'Slate', dep:'12:30 PM', arr:'3:30 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:3290, craft:'CRJ-200', seats:3, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-11' },
    { id:'slate-fllhpn-23', airline:'Slate', dep:'10:00 AM', arr:'1:00 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:2790, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-13' },
    { id:'slate-fllhpn-24', airline:'Slate', dep:'2:30 PM', arr:'5:30 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-15' },
    { id:'slate-fllhpn-25', airline:'Slate', dep:'12:30 PM', arr:'3:30 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-18' },
    { id:'slate-fllhpn-26', airline:'Slate', dep:'10:00 AM', arr:'1:00 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-20' },
    { id:'slate-fllhpn-27', airline:'Slate', dep:'2:30 PM', arr:'5:30 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-22' },
    { id:'slate-fllhpn-28', airline:'Slate', dep:'12:30 PM', arr:'3:30 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:2690, craft:'CRJ-200', seats:5, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-25' },
    { id:'slate-fllhpn-29', airline:'Slate', dep:'10:00 AM', arr:'1:00 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:5, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-27' },
    { id:'slate-fllhpn-30', airline:'Slate', dep:'2:30 PM', arr:'5:30 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:7, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-29' },
    { id:'slate-fllhpn-31', airline:'Slate', dep:'12:30 PM', arr:'3:30 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-02' },
    { id:'slate-fllhpn-32', airline:'Slate', dep:'10:00 AM', arr:'1:00 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-04' },
    { id:'slate-fllhpn-33', airline:'Slate', dep:'2:30 PM', arr:'5:30 PM', dc:'FLL', ac:'HPN', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-06' },
  ],
  // NOTE: HPN↔BCT service ended July 2025, relocated to FXE. Kept for reference/seasonal.
  'HPN-BCT': [
    { id:'jsx-hbc1', airline:'JSX', dep:'7:00 AM', arr:'10:00 AM', dc:'HPN', ac:'BCT', dur:'3h 00m', price:449, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
    { id:'jsx-hbc2', airline:'JSX', dep:'4:30 PM', arr:'7:30 PM', dc:'HPN', ac:'BCT', dur:'3h 00m', price:449, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
  ],
  'BCT-HPN': [
    { id:'jsx-bch1', airline:'JSX', dep:'7:00 AM', arr:'10:00 AM', dc:'BCT', ac:'HPN', dur:'3h 00m', price:449, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
    { id:'jsx-bch2', airline:'JSX', dep:'4:30 PM', arr:'7:30 PM', dc:'BCT', ac:'HPN', dur:'3h 00m', price:449, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
  ],
  'HPN-APF': [
    { id:'jsx-hap1', airline:'JSX', dep:'7:00 AM', arr:'10:05 AM', dc:'HPN', ac:'APF', dur:'3h 05m', price:499, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
    { id:'jsx-hap2', airline:'JSX', dep:'4:30 PM', arr:'7:35 PM', dc:'HPN', ac:'APF', dur:'3h 05m', price:499, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
  ],
  'APF-HPN': [
    { id:'jsx-aph1', airline:'JSX', dep:'7:00 AM', arr:'10:05 AM', dc:'APF', ac:'HPN', dur:'3h 05m', price:499, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
    { id:'jsx-aph2', airline:'JSX', dep:'4:30 PM', arr:'7:35 PM', dc:'APF', ac:'HPN', dur:'3h 05m', price:499, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
  ],
  'TEB-PBI': [
    { id:'jsx-tp1', airline:'JSX', dep:'7:00 AM', arr:'9:55 AM', dc:'TEB', ac:'PBI', dur:'2h 55m', price:449, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
    { id:'jsx-tp2', airline:'JSX', dep:'4:30 PM', arr:'7:25 PM', dc:'TEB', ac:'PBI', dur:'2h 55m', price:449, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
      { id:'slate-tebpbi-1', airline:'Slate', dep:'5:30 PM', arr:'8:30 PM', dc:'TEB', ac:'PBI', dur:'3h 00m', price:1890, craft:'CRJ-200', seats:18, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-15' },
    { id:'slate-tebpbi-2', airline:'Slate', dep:'4:30 PM', arr:'7:30 PM', dc:'TEB', ac:'PBI', dur:'3h 00m', price:2090, craft:'CRJ-200', seats:12, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-16' },
    { id:'slate-tebpbi-3', airline:'Slate', dep:'2:00 PM', arr:'5:00 PM', dc:'TEB', ac:'PBI', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:14, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-18' },
    { id:'slate-tebpbi-4', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'TEB', ac:'PBI', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:15, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-19' },
    { id:'slate-tebpbi-5', airline:'Slate', dep:'4:30 PM', arr:'7:30 PM', dc:'TEB', ac:'PBI', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:13, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-23' },
    { id:'slate-tebpbi-6', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'TEB', ac:'PBI', dur:'3h 00m', price:3490, craft:'CRJ-200', seats:5, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-26' },
    { id:'slate-tebpbi-7', airline:'Slate', dep:'2:30 PM', arr:'5:30 PM', dc:'TEB', ac:'PBI', dur:'3h 00m', price:2790, craft:'CRJ-200', seats:13, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-02' },
    { id:'slate-tebpbi-8', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'TEB', ac:'PBI', dur:'3h 00m', price:3090, craft:'CRJ-200', seats:11, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-05' },
    { id:'slate-tebpbi-9', airline:'Slate', dep:'2:30 PM', arr:'5:30 PM', dc:'TEB', ac:'PBI', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:18, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-09' },
    { id:'slate-tebpbi-10', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'TEB', ac:'PBI', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:12, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-12' },
    { id:'slate-tebpbi-11', airline:'Slate', dep:'2:30 PM', arr:'5:30 PM', dc:'TEB', ac:'PBI', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-16' },
    { id:'slate-tebpbi-12', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'TEB', ac:'PBI', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-19' },
    { id:'slate-tebpbi-13', airline:'Slate', dep:'2:30 PM', arr:'5:30 PM', dc:'TEB', ac:'PBI', dur:'3h 00m', price:3590, craft:'CRJ-200', seats:4, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-23' },
    { id:'slate-tebpbi-14', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'TEB', ac:'PBI', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-26' },
    { id:'slate-tebpbi-15', airline:'Slate', dep:'2:30 PM', arr:'5:30 PM', dc:'TEB', ac:'PBI', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-30' },
    { id:'slate-tebpbi-16', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'TEB', ac:'PBI', dur:'3h 00m', price:2890, craft:'CRJ-200', seats:4, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-02' },
    { id:'slate-tebpbi-17', airline:'Slate', dep:'2:30 PM', arr:'5:30 PM', dc:'TEB', ac:'PBI', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:7, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-06' },
    { id:'slate-tebpbi-18', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'TEB', ac:'PBI', dur:'3h 00m', price:2990, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-09' },
    { id:'slate-tebpbi-19', airline:'Slate', dep:'2:30 PM', arr:'5:30 PM', dc:'TEB', ac:'PBI', dur:'3h 00m', price:2890, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-13' },
    { id:'slate-tebpbi-20', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'TEB', ac:'PBI', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-16' },
    { id:'slate-tebpbi-21', airline:'Slate', dep:'2:30 PM', arr:'5:30 PM', dc:'TEB', ac:'PBI', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-20' },
    { id:'slate-tebpbi-22', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'TEB', ac:'PBI', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-23' },
    { id:'slate-tebpbi-23', airline:'Slate', dep:'2:30 PM', arr:'5:30 PM', dc:'TEB', ac:'PBI', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-27' },
    { id:'slate-tebpbi-24', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'TEB', ac:'PBI', dur:'3h 00m', price:2790, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-30' },
    { id:'slate-tebpbi-25', airline:'Slate', dep:'2:30 PM', arr:'5:30 PM', dc:'TEB', ac:'PBI', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-04' },
    { id:'slate-tebpbi-26', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'TEB', ac:'PBI', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-07' },
    { id:'slate-tebpbi-27', airline:'Slate', dep:'2:30 PM', arr:'5:30 PM', dc:'TEB', ac:'PBI', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-11' },
    { id:'slate-tebpbi-28', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'TEB', ac:'PBI', dur:'3h 00m', price:2090, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-14' },
    { id:'slate-tebpbi-29', airline:'Slate', dep:'2:30 PM', arr:'5:30 PM', dc:'TEB', ac:'PBI', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-18' },
    { id:'slate-tebpbi-30', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'TEB', ac:'PBI', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-21' },
    { id:'slate-tebpbi-31', airline:'Slate', dep:'2:30 PM', arr:'5:30 PM', dc:'TEB', ac:'PBI', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-25' },
    { id:'slate-tebpbi-32', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'TEB', ac:'PBI', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-28' },
  ],
  'PBI-TEB': [
    { id:'jsx-pt1', airline:'JSX', dep:'7:00 AM', arr:'9:55 AM', dc:'PBI', ac:'TEB', dur:'2h 55m', price:449, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
    { id:'jsx-pt2', airline:'JSX', dep:'4:30 PM', arr:'7:25 PM', dc:'PBI', ac:'TEB', dur:'2h 55m', price:449, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
      { id:'slate-pbiteb-1', airline:'Slate', dep:'12:30 PM', arr:'3:30 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:10, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-15' },
    { id:'slate-pbiteb-2', airline:'Slate', dep:'10:30 AM', arr:'1:30 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:3190, craft:'CRJ-200', seats:10, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-16' },
    { id:'slate-pbiteb-3', airline:'Slate', dep:'10:00 AM', arr:'1:00 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:3690, craft:'CRJ-200', seats:3, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-17' },
    { id:'slate-pbiteb-4', airline:'Slate', dep:'6:30 PM', arr:'9:30 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:10, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-18' },
    { id:'slate-pbiteb-5', airline:'Slate', dep:'10:00 AM', arr:'1:00 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:9, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-19' },
    { id:'slate-pbiteb-6', airline:'Slate', dep:'11:00 AM', arr:'2:00 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:3090, craft:'CRJ-200', seats:7, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-23' },
    { id:'slate-pbiteb-7', airline:'Slate', dep:'10:00 AM', arr:'1:00 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:14, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-26' },
    { id:'slate-pbiteb-8', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:14, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-01' },
    { id:'slate-pbiteb-9', airline:'Slate', dep:'9:30 AM', arr:'12:30 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:3190, craft:'CRJ-200', seats:11, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-02' },
    { id:'slate-pbiteb-10', airline:'Slate', dep:'10:00 AM', arr:'1:00 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:13, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-05' },
    { id:'slate-pbiteb-11', airline:'Slate', dep:'12:00 PM', arr:'3:00 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:17, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-06' },
    { id:'slate-pbiteb-12', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:13, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-08' },
    { id:'slate-pbiteb-13', airline:'Slate', dep:'9:30 AM', arr:'12:30 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2890, craft:'CRJ-200', seats:13, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-09' },
    { id:'slate-pbiteb-14', airline:'Slate', dep:'10:00 AM', arr:'1:00 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:17, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-12' },
    { id:'slate-pbiteb-15', airline:'Slate', dep:'12:00 PM', arr:'3:00 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:18, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-13' },
    { id:'slate-pbiteb-16', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:14, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-15' },
    { id:'slate-pbiteb-17', airline:'Slate', dep:'9:30 AM', arr:'12:30 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-16' },
    { id:'slate-pbiteb-18', airline:'Slate', dep:'10:00 AM', arr:'1:00 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2790, craft:'CRJ-200', seats:5, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-19' },
    { id:'slate-pbiteb-19', airline:'Slate', dep:'12:00 PM', arr:'3:00 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:7, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-20' },
    { id:'slate-pbiteb-20', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2690, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-22' },
    { id:'slate-pbiteb-21', airline:'Slate', dep:'9:30 AM', arr:'12:30 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:3290, craft:'CRJ-200', seats:5, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-23' },
    { id:'slate-pbiteb-22', airline:'Slate', dep:'10:00 AM', arr:'1:00 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:3090, craft:'CRJ-200', seats:5, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-26' },
    { id:'slate-pbiteb-23', airline:'Slate', dep:'12:00 PM', arr:'3:00 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-27' },
    { id:'slate-pbiteb-24', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:3190, craft:'CRJ-200', seats:4, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-29' },
    { id:'slate-pbiteb-25', airline:'Slate', dep:'9:30 AM', arr:'12:30 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:3390, craft:'CRJ-200', seats:3, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-30' },
    { id:'slate-pbiteb-26', airline:'Slate', dep:'10:00 AM', arr:'1:00 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:3190, craft:'CRJ-200', seats:3, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-02' },
    { id:'slate-pbiteb-27', airline:'Slate', dep:'12:00 PM', arr:'3:00 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2690, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-03' },
    { id:'slate-pbiteb-28', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:7, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-05' },
    { id:'slate-pbiteb-29', airline:'Slate', dep:'9:30 AM', arr:'12:30 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:3190, craft:'CRJ-200', seats:2, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-06' },
    { id:'slate-pbiteb-30', airline:'Slate', dep:'10:00 AM', arr:'1:00 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2690, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-09' },
    { id:'slate-pbiteb-31', airline:'Slate', dep:'12:00 PM', arr:'3:00 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:5, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-10' },
    { id:'slate-pbiteb-32', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:3490, craft:'CRJ-200', seats:4, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-12' },
    { id:'slate-pbiteb-33', airline:'Slate', dep:'9:30 AM', arr:'12:30 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2990, craft:'CRJ-200', seats:7, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-13' },
    { id:'slate-pbiteb-34', airline:'Slate', dep:'10:00 AM', arr:'1:00 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2990, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-16' },
    { id:'slate-pbiteb-35', airline:'Slate', dep:'12:00 PM', arr:'3:00 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2890, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-17' },
    { id:'slate-pbiteb-36', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-19' },
    { id:'slate-pbiteb-37', airline:'Slate', dep:'9:30 AM', arr:'12:30 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2790, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-20' },
    { id:'slate-pbiteb-38', airline:'Slate', dep:'10:00 AM', arr:'1:00 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2990, craft:'CRJ-200', seats:4, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-23' },
    { id:'slate-pbiteb-39', airline:'Slate', dep:'12:00 PM', arr:'3:00 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-24' },
    { id:'slate-pbiteb-40', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-26' },
    { id:'slate-pbiteb-41', airline:'Slate', dep:'9:30 AM', arr:'12:30 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2690, craft:'CRJ-200', seats:5, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-27' },
    { id:'slate-pbiteb-42', airline:'Slate', dep:'10:00 AM', arr:'1:00 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2690, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-30' },
    { id:'slate-pbiteb-43', airline:'Slate', dep:'12:00 PM', arr:'3:00 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2690, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-01' },
    { id:'slate-pbiteb-44', airline:'Slate', dep:'4:00 PM', arr:'7:00 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-03' },
    { id:'slate-pbiteb-45', airline:'Slate', dep:'9:30 AM', arr:'12:30 PM', dc:'PBI', ac:'TEB', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-04' },
  ],
  // NOTE: Research suggests MMU serves PBI/APF, not FLL directly. Kept for now.
  'MMU-FLL': [
    { id:'jsx-mf1', airline:'JSX', dep:'7:00 AM', arr:'10:00 AM', dc:'MMU', ac:'FLL', dur:'3h 00m', price:449, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
    { id:'jsx-mf2', airline:'JSX', dep:'4:30 PM', arr:'7:30 PM', dc:'MMU', ac:'FLL', dur:'3h 00m', price:449, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
  ],
  'FLL-MMU': [
    { id:'jsx-fm1', airline:'JSX', dep:'7:00 AM', arr:'10:00 AM', dc:'FLL', ac:'MMU', dur:'3h 00m', price:449, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
    { id:'jsx-fm2', airline:'JSX', dep:'4:30 PM', arr:'7:30 PM', dc:'FLL', ac:'MMU', dur:'3h 00m', price:449, craft:'ERJ-135', seats:5, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
  ],

  // ═══ JSX: Cabo ═══
  // JSX BUR↔SJD: Corrected (ERJ-135). BUR=PT, SJD=MST(+1h) — local times shown
  'BUR-SJD': [
    { id:'jsx-bsj1', airline:'JSX', dep:'7:00 AM', arr:'10:40 AM', dc:'BUR', ac:'SJD', dur:'2h 40m', price:599, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
    { id:'jsx-bsj2', airline:'JSX', dep:'12:00 PM', arr:'3:40 PM', dc:'BUR', ac:'SJD', dur:'2h 40m', price:599, craft:'ERJ-135', seats:6, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
  ],
  'SJD-BUR': [
    { id:'jsx-sjb1', airline:'JSX', dep:'7:00 AM', arr:'8:40 AM', dc:'SJD', ac:'BUR', dur:'2h 40m', price:599, craft:'ERJ-135', seats:7, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
    { id:'jsx-sjb2', airline:'JSX', dep:'2:00 PM', arr:'3:40 PM', dc:'SJD', ac:'BUR', dur:'2h 40m', price:599, craft:'ERJ-135', seats:6, amen:['WiFi','Snacks','Cocktails'], link:'jsx.com' },
  ],

  // ═══ Slate: Miami (MIA) routes (scraped from app.flyslate.com, Feb-May 2026 season) ═══
  'TEB-MIA': [
    { id:'slate-tebmia-1', airline:'Slate', dep:'2:00 PM', arr:'5:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:1990, craft:'CRJ-200', seats:15, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-20' },
    { id:'slate-tebmia-2', airline:'Slate', dep:'1:00 PM', arr:'4:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:15, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-26' },
    { id:'slate-tebmia-3', airline:'Slate', dep:'2:00 PM', arr:'5:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:13, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-27' },
    { id:'slate-tebmia-4', airline:'Slate', dep:'6:00 PM', arr:'9:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:1890, craft:'CRJ-200', seats:18, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-01' },
    { id:'slate-tebmia-5', airline:'Slate', dep:'1:00 PM', arr:'4:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2090, craft:'CRJ-200', seats:18, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-05' },
    { id:'slate-tebmia-6', airline:'Slate', dep:'3:00 PM', arr:'6:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:17, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-06' },
    { id:'slate-tebmia-7', airline:'Slate', dep:'6:00 PM', arr:'9:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:18, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-08' },
    { id:'slate-tebmia-8', airline:'Slate', dep:'1:00 PM', arr:'4:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:17, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-12' },
    { id:'slate-tebmia-9', airline:'Slate', dep:'3:00 PM', arr:'6:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:18, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-13' },
    { id:'slate-tebmia-10', airline:'Slate', dep:'6:00 PM', arr:'9:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:15, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-15' },
    { id:'slate-tebmia-11', airline:'Slate', dep:'1:00 PM', arr:'4:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-19' },
    { id:'slate-tebmia-12', airline:'Slate', dep:'3:00 PM', arr:'6:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:3490, craft:'CRJ-200', seats:4, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-20' },
    { id:'slate-tebmia-13', airline:'Slate', dep:'6:00 PM', arr:'9:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-22' },
    { id:'slate-tebmia-14', airline:'Slate', dep:'1:00 PM', arr:'4:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:3790, craft:'CRJ-200', seats:3, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-26' },
    { id:'slate-tebmia-15', airline:'Slate', dep:'3:00 PM', arr:'6:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-27' },
    { id:'slate-tebmia-16', airline:'Slate', dep:'6:00 PM', arr:'9:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-29' },
    { id:'slate-tebmia-17', airline:'Slate', dep:'1:00 PM', arr:'4:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-02' },
    { id:'slate-tebmia-18', airline:'Slate', dep:'3:00 PM', arr:'6:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2090, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-03' },
    { id:'slate-tebmia-19', airline:'Slate', dep:'6:00 PM', arr:'9:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-05' },
    { id:'slate-tebmia-20', airline:'Slate', dep:'1:00 PM', arr:'4:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-09' },
    { id:'slate-tebmia-21', airline:'Slate', dep:'3:00 PM', arr:'6:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-10' },
    { id:'slate-tebmia-22', airline:'Slate', dep:'6:00 PM', arr:'9:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2690, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-12' },
    { id:'slate-tebmia-23', airline:'Slate', dep:'1:00 PM', arr:'4:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-16' },
    { id:'slate-tebmia-24', airline:'Slate', dep:'3:00 PM', arr:'6:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-17' },
    { id:'slate-tebmia-25', airline:'Slate', dep:'6:00 PM', arr:'9:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-19' },
    { id:'slate-tebmia-26', airline:'Slate', dep:'1:00 PM', arr:'4:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-23' },
    { id:'slate-tebmia-27', airline:'Slate', dep:'3:00 PM', arr:'6:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-24' },
    { id:'slate-tebmia-28', airline:'Slate', dep:'6:00 PM', arr:'9:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-26' },
    { id:'slate-tebmia-29', airline:'Slate', dep:'1:00 PM', arr:'4:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-30' },
    { id:'slate-tebmia-30', airline:'Slate', dep:'3:00 PM', arr:'6:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-01' },
    { id:'slate-tebmia-31', airline:'Slate', dep:'6:00 PM', arr:'9:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-03' },
    { id:'slate-tebmia-32', airline:'Slate', dep:'1:00 PM', arr:'4:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-07' },
    { id:'slate-tebmia-33', airline:'Slate', dep:'3:00 PM', arr:'6:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-08' },
    { id:'slate-tebmia-34', airline:'Slate', dep:'6:00 PM', arr:'9:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-10' },
    { id:'slate-tebmia-35', airline:'Slate', dep:'1:00 PM', arr:'4:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2090, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-14' },
    { id:'slate-tebmia-36', airline:'Slate', dep:'3:00 PM', arr:'6:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-15' },
    { id:'slate-tebmia-37', airline:'Slate', dep:'6:00 PM', arr:'9:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-17' },
    { id:'slate-tebmia-38', airline:'Slate', dep:'1:00 PM', arr:'4:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-21' },
    { id:'slate-tebmia-39', airline:'Slate', dep:'3:00 PM', arr:'6:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2690, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-22' },
    { id:'slate-tebmia-40', airline:'Slate', dep:'6:00 PM', arr:'9:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-24' },
    { id:'slate-tebmia-41', airline:'Slate', dep:'1:00 PM', arr:'4:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-28' },
    { id:'slate-tebmia-42', airline:'Slate', dep:'3:00 PM', arr:'6:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-29' },
    { id:'slate-tebmia-43', airline:'Slate', dep:'6:00 PM', arr:'9:00 PM', dc:'TEB', ac:'MIA', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-31' },
  ],
  'MIA-TEB': [
    { id:'slate-miateb-1', airline:'Slate', dep:'6:00 PM', arr:'9:00 PM', dc:'MIA', ac:'TEB', dur:'3h 00m', price:2090, craft:'CRJ-200', seats:17, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-02-26' },
    { id:'slate-miateb-2', airline:'Slate', dep:'2:00 PM', arr:'5:00 PM', dc:'MIA', ac:'TEB', dur:'3h 00m', price:3190, craft:'CRJ-200', seats:10, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-01' },
    { id:'slate-miateb-3', airline:'Slate', dep:'11:00 AM', arr:'2:00 PM', dc:'MIA', ac:'TEB', dur:'3h 00m', price:1890, craft:'CRJ-200', seats:18, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-02' },
    { id:'slate-miateb-4', airline:'Slate', dep:'6:00 PM', arr:'9:00 PM', dc:'MIA', ac:'TEB', dur:'3h 00m', price:1990, craft:'CRJ-200', seats:18, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-05' },
    { id:'slate-miateb-5', airline:'Slate', dep:'2:00 PM', arr:'5:00 PM', dc:'MIA', ac:'TEB', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:18, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-08' },
    { id:'slate-miateb-6', airline:'Slate', dep:'11:00 AM', arr:'2:00 PM', dc:'MIA', ac:'TEB', dur:'3h 00m', price:2090, craft:'CRJ-200', seats:18, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-09' },
    { id:'slate-miateb-7', airline:'Slate', dep:'6:00 PM', arr:'9:00 PM', dc:'MIA', ac:'TEB', dur:'3h 00m', price:2090, craft:'CRJ-200', seats:17, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-12' },
    { id:'slate-miateb-8', airline:'Slate', dep:'2:00 PM', arr:'5:00 PM', dc:'MIA', ac:'TEB', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:14, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-15' },
    { id:'slate-miateb-9', airline:'Slate', dep:'11:00 AM', arr:'2:00 PM', dc:'MIA', ac:'TEB', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-16' },
    { id:'slate-miateb-10', airline:'Slate', dep:'6:00 PM', arr:'9:00 PM', dc:'MIA', ac:'TEB', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-19' },
    { id:'slate-miateb-11', airline:'Slate', dep:'2:00 PM', arr:'5:00 PM', dc:'MIA', ac:'TEB', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-22' },
    { id:'slate-miateb-12', airline:'Slate', dep:'11:00 AM', arr:'2:00 PM', dc:'MIA', ac:'TEB', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-23' },
    { id:'slate-miateb-13', airline:'Slate', dep:'6:00 PM', arr:'9:00 PM', dc:'MIA', ac:'TEB', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:7, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-26' },
    { id:'slate-miateb-14', airline:'Slate', dep:'2:00 PM', arr:'5:00 PM', dc:'MIA', ac:'TEB', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-29' },
    { id:'slate-miateb-15', airline:'Slate', dep:'11:00 AM', arr:'2:00 PM', dc:'MIA', ac:'TEB', dur:'3h 00m', price:2390, craft:'CRJ-200', seats:6, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-03-30' },
    { id:'slate-miateb-16', airline:'Slate', dep:'6:00 PM', arr:'9:00 PM', dc:'MIA', ac:'TEB', dur:'3h 00m', price:1990, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-02' },
    { id:'slate-miateb-17', airline:'Slate', dep:'2:00 PM', arr:'5:00 PM', dc:'MIA', ac:'TEB', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-05' },
    { id:'slate-miateb-18', airline:'Slate', dep:'11:00 AM', arr:'2:00 PM', dc:'MIA', ac:'TEB', dur:'3h 00m', price:2890, craft:'CRJ-200', seats:4, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-06' },
    { id:'slate-miateb-19', airline:'Slate', dep:'6:00 PM', arr:'9:00 PM', dc:'MIA', ac:'TEB', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-09' },
    { id:'slate-miateb-20', airline:'Slate', dep:'2:00 PM', arr:'5:00 PM', dc:'MIA', ac:'TEB', dur:'3h 00m', price:3840, craft:'CRJ-200', seats:4, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-12' },
    { id:'slate-miateb-21', airline:'Slate', dep:'11:00 AM', arr:'2:00 PM', dc:'MIA', ac:'TEB', dur:'3h 00m', price:2790, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-13' },
    { id:'slate-miateb-22', airline:'Slate', dep:'6:00 PM', arr:'9:00 PM', dc:'MIA', ac:'TEB', dur:'3h 00m', price:2490, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-16' },
    { id:'slate-miateb-23', airline:'Slate', dep:'2:00 PM', arr:'5:00 PM', dc:'MIA', ac:'TEB', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-19' },
    { id:'slate-miateb-24', airline:'Slate', dep:'11:00 AM', arr:'2:00 PM', dc:'MIA', ac:'TEB', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-20' },
    { id:'slate-miateb-25', airline:'Slate', dep:'6:00 PM', arr:'9:00 PM', dc:'MIA', ac:'TEB', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-23' },
    { id:'slate-miateb-26', airline:'Slate', dep:'2:00 PM', arr:'5:00 PM', dc:'MIA', ac:'TEB', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-26' },
    { id:'slate-miateb-27', airline:'Slate', dep:'11:00 AM', arr:'2:00 PM', dc:'MIA', ac:'TEB', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-27' },
    { id:'slate-miateb-28', airline:'Slate', dep:'6:00 PM', arr:'9:00 PM', dc:'MIA', ac:'TEB', dur:'3h 00m', price:2590, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-04-30' },
    { id:'slate-miateb-29', airline:'Slate', dep:'2:00 PM', arr:'5:00 PM', dc:'MIA', ac:'TEB', dur:'3h 00m', price:2290, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-03' },
    { id:'slate-miateb-30', airline:'Slate', dep:'11:00 AM', arr:'2:00 PM', dc:'MIA', ac:'TEB', dur:'3h 00m', price:2190, craft:'CRJ-200', seats:8, amen:['WiFi','Catering','Champagne'], link:'flyslate.com', date:'2026-05-04' },
  ],

    // ═══ Aero: LA ↔ Los Cabos (real schedule from aero.com, seasonal Feb–Jul 2026) ═══
  // NOTE: Mexican authorities require that passengers departing Mexico via SJD with Aero
  // have previously entered Mexico from SJD with Aero.
  'VNY-SJD': [
    { id:'aero-sj1', airline:'Aero', dep:'9:30 AM', arr:'12:00 PM', dc:'VNY', ac:'SJD', dur:'2h 30m', price:1950, craft:'ERJ-135', seats:4, amen:['WiFi','Gourmet Catering','Champagne'], link:'aero.com' },
  ],
  'SJD-VNY': [
    { id:'aero-sjv1', airline:'Aero', dep:'1:30 PM', arr:'4:15 PM', dc:'SJD', ac:'VNY', dur:'2h 45m', price:1950, craft:'ERJ-135', seats:4, amen:['WiFi','Gourmet Catering','Champagne'], link:'aero.com' },
  ],
  // ═══ Aero: LA → Coachella Valley/Thermal (real schedule from aero.com, seasonal Apr 2026) ═══
  // Times vary by date; representative flights shown. Coachella 2026: Apr 10–12 (Wk 1), Apr 17–19 (Wk 2)
  'VNY-TRM': [
    { id:'aero-tr1', airline:'Aero', dep:'9:00 AM', arr:'9:45 AM', dc:'VNY', ac:'TRM', dur:'0h 45m', price:775, craft:'ERJ-135', seats:4, amen:['WiFi','Gourmet Catering','Champagne'], link:'aero.com' },
    { id:'aero-tr2', airline:'Aero', dep:'12:00 PM', arr:'12:45 PM', dc:'VNY', ac:'TRM', dur:'0h 45m', price:975, craft:'ERJ-135', seats:4, amen:['WiFi','Gourmet Catering','Champagne'], link:'aero.com' },
    { id:'aero-tr3', airline:'Aero', dep:'5:15 PM', arr:'6:00 PM', dc:'VNY', ac:'TRM', dur:'0h 45m', price:1195, craft:'ERJ-135', seats:4, amen:['WiFi','Gourmet Catering','Champagne'], link:'aero.com' },
  ],
  'TRM-VNY': [
    { id:'aero-tv1', airline:'Aero', dep:'10:15 AM', arr:'11:05 AM', dc:'TRM', ac:'VNY', dur:'0h 50m', price:775, craft:'ERJ-135', seats:4, amen:['WiFi','Gourmet Catering','Champagne'], link:'aero.com' },
    { id:'aero-tv2', airline:'Aero', dep:'1:15 PM', arr:'2:05 PM', dc:'TRM', ac:'VNY', dur:'0h 50m', price:775, craft:'ERJ-135', seats:4, amen:['WiFi','Gourmet Catering','Champagne'], link:'aero.com' },
    { id:'aero-tv3', airline:'Aero', dep:'6:50 PM', arr:'7:40 PM', dc:'TRM', ac:'VNY', dur:'0h 50m', price:775, craft:'ERJ-135', seats:4, amen:['WiFi','Gourmet Catering','Champagne'], link:'aero.com' },
  ],
  // Aero VNY↔OGG (Maui): Real schedule from aero.com (seasonal, Sat outbound / Sun return, Feb–Aug 2026)
  'VNY-OGG': [
    { id:'aero-og1', airline:'Aero', dep:'10:45 AM', arr:'1:35 PM', dc:'VNY', ac:'OGG', dur:'5h 50m', price:5495, craft:'ERJ-135', seats:4, amen:['WiFi','Gourmet Catering','Champagne','Lie-Flat Seats'], link:'aero.com' },
  ],
  'OGG-VNY': [
    { id:'aero-ogv1', airline:'Aero', dep:'12:00 PM', arr:'8:15 PM', dc:'OGG', ac:'VNY', dur:'5h 15m', price:5495, craft:'ERJ-135', seats:4, amen:['WiFi','Gourmet Catering','Champagne','Lie-Flat Seats'], link:'aero.com' },
  ],

  // ═══ Aero: New York ↔ Los Angeles (seasonal — real dates from aero.com) ═══
  'VNY-TEB': [
    { id:'aero-ny1', airline:'Aero', dep:'8:00 AM', arr:'3:40 PM', dc:'VNY', ac:'TEB', dur:'4h 40m', price:5500, craft:'ERJ-135', seats:4, amen:['WiFi','Gourmet Catering','Champagne','Lie-Flat Seats'], link:'aero.com' },
  ],
  'TEB-VNY': [
    { id:'aero-la1', airline:'Aero', dep:'12:00 PM', arr:'3:00 PM', dc:'TEB', ac:'VNY', dur:'6h 0m', price:5500, craft:'ERJ-135', seats:4, amen:['WiFi','Gourmet Catering','Champagne','Lie-Flat Seats'], link:'aero.com' },
  ],

  // ═══ JSX: Santa Monica → Coachella Valley (seasonal, around Coachella festival) ═══
  'SMO-TRM': [
    { id:'jsx-cv1', airline:'JSX', dep:'9:35 AM', arr:'10:25 AM', dc:'SMO', ac:'TRM', dur:'0h 50m', price:406, craft:'ATR 42', seats:5, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-cv2', airline:'JSX', dep:'4:10 PM', arr:'5:00 PM', dc:'SMO', ac:'TRM', dur:'0h 50m', price:606, craft:'ATR 42', seats:3, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],
  'TRM-SMO': [
    { id:'jsx-cvr1', airline:'JSX', dep:'1:30 PM', arr:'2:25 PM', dc:'TRM', ac:'SMO', dur:'0h 55m', price:606, craft:'ATR 42', seats:4, amen:['WiFi','Snacks'], link:'jsx.com' },
    { id:'jsx-cvr2', airline:'JSX', dep:'4:35 PM', arr:'5:30 PM', dc:'TRM', ac:'SMO', dur:'0h 55m', price:406, craft:'ATR 42', seats:5, amen:['WiFi','Snacks'], link:'jsx.com' },
  ],

  // ═══ Surf Air / Southern Airways Express ═══
  'LAX-PHX': [
    { id:'surf-lp1', airline:'Surf Air', dep:'8:00 AM', arr:'12:28 PM', dc:'LAX', ac:'PHX', dur:'3h 28m', price:99, craft:'Cessna Grand Caravan', seats:9, amen:['Snacks'], link:'surfair.com' },
  ],
  'PHX-LAX': [
    { id:'surf-pl1', airline:'Surf Air', dep:'1:10 PM', arr:'3:56 PM', dc:'PHX', ac:'LAX', dur:'3h 46m', price:99, craft:'Cessna Grand Caravan', seats:9, amen:['Snacks'], link:'surfair.com' },
  ],
  'LAX-IPL': [
    { id:'surf-li1', airline:'Surf Air', dep:'8:00 AM', arr:'9:25 AM', dc:'LAX', ac:'IPL', dur:'1h 25m', price:109, craft:'Cessna Grand Caravan', seats:9, amen:['Snacks'], link:'surfair.com' },
    { id:'surf-li2', airline:'Surf Air', dep:'4:35 PM', arr:'6:00 PM', dc:'LAX', ac:'IPL', dur:'1h 25m', price:109, craft:'Cessna Grand Caravan', seats:9, amen:['Snacks'], link:'surfair.com' },
    { id:'surf-li3', airline:'Surf Air', dep:'8:45 PM', arr:'10:10 PM', dc:'LAX', ac:'IPL', dur:'1h 25m', price:109, craft:'Cessna Grand Caravan', seats:9, amen:['Snacks'], link:'surfair.com' },
  ],
  'IPL-LAX': [
    { id:'surf-il1', airline:'Surf Air', dep:'6:00 AM', arr:'7:31 AM', dc:'IPL', ac:'LAX', dur:'1h 31m', price:109, craft:'Cessna Grand Caravan', seats:9, amen:['Snacks'], link:'surfair.com' },
    { id:'surf-il2', airline:'Surf Air', dep:'2:25 PM', arr:'3:56 PM', dc:'IPL', ac:'LAX', dur:'1h 31m', price:109, craft:'Cessna Grand Caravan', seats:9, amen:['Snacks'], link:'surfair.com' },
    { id:'surf-il3', airline:'Surf Air', dep:'6:30 PM', arr:'8:01 PM', dc:'IPL', ac:'LAX', dur:'1h 31m', price:109, craft:'Cessna Grand Caravan', seats:9, amen:['Snacks'], link:'surfair.com' },
  ],

  // ═══ Tradewind: Caribbean & Bahamas ═══
  'SJU-VIJ': [
    { id:'tw-sv1', airline:'Tradewind', dep:'8:00 AM', arr:'8:45 AM', dc:'SJU', ac:'VIJ', dur:'0h 45m', price:295, craft:'Pilatus PC-12', seats:6, amen:['WiFi','Snacks'], link:'flytradewind.com' },
    { id:'tw-sv2', airline:'Tradewind', dep:'12:30 PM', arr:'1:15 PM', dc:'SJU', ac:'VIJ', dur:'0h 45m', price:305, craft:'Pilatus PC-12', seats:5, amen:['WiFi','Snacks'], link:'flytradewind.com' },
    { id:'tw-sv3', airline:'Tradewind', dep:'4:00 PM', arr:'4:45 PM', dc:'SJU', ac:'VIJ', dur:'0h 45m', price:285, craft:'Pilatus PC-12', seats:6, amen:['WiFi','Snacks'], link:'flytradewind.com' },
  ],
  'VIJ-SJU': [
    { id:'tw-vs1', airline:'Tradewind', dep:'7:00 AM', arr:'7:45 AM', dc:'VIJ', ac:'SJU', dur:'0h 45m', price:295, craft:'Pilatus PC-12', seats:6, amen:['WiFi','Snacks'], link:'flytradewind.com' },
    { id:'tw-vs2', airline:'Tradewind', dep:'11:00 AM', arr:'11:45 AM', dc:'VIJ', ac:'SJU', dur:'0h 45m', price:285, craft:'Pilatus PC-12', seats:5, amen:['WiFi','Snacks'], link:'flytradewind.com' },
    { id:'tw-vs3', airline:'Tradewind', dep:'5:30 PM', arr:'6:15 PM', dc:'VIJ', ac:'SJU', dur:'0h 45m', price:305, craft:'Pilatus PC-12', seats:6, amen:['WiFi','Snacks'], link:'flytradewind.com' },
  ],
  'SJU-EIS': [
    { id:'tw-se1', airline:'Tradewind', dep:'8:15 AM', arr:'8:55 AM', dc:'SJU', ac:'EIS', dur:'0h 40m', price:275, craft:'Pilatus PC-12', seats:6, amen:['WiFi','Snacks'], link:'flytradewind.com' },
    { id:'tw-se2', airline:'Tradewind', dep:'1:00 PM', arr:'1:40 PM', dc:'SJU', ac:'EIS', dur:'0h 40m', price:285, craft:'Pilatus PC-12', seats:5, amen:['WiFi','Snacks'], link:'flytradewind.com' },
    { id:'tw-se3', airline:'Tradewind', dep:'4:30 PM', arr:'5:10 PM', dc:'SJU', ac:'EIS', dur:'0h 40m', price:265, craft:'Pilatus PC-12', seats:6, amen:['WiFi','Snacks'], link:'flytradewind.com' },
  ],
  'EIS-SJU': [
    { id:'tw-es1', airline:'Tradewind', dep:'7:30 AM', arr:'8:10 AM', dc:'EIS', ac:'SJU', dur:'0h 40m', price:275, craft:'Pilatus PC-12', seats:6, amen:['WiFi','Snacks'], link:'flytradewind.com' },
    { id:'tw-es2', airline:'Tradewind', dep:'11:30 AM', arr:'12:10 PM', dc:'EIS', ac:'SJU', dur:'0h 40m', price:265, craft:'Pilatus PC-12', seats:5, amen:['WiFi','Snacks'], link:'flytradewind.com' },
    { id:'tw-es3', airline:'Tradewind', dep:'5:45 PM', arr:'6:25 PM', dc:'EIS', ac:'SJU', dur:'0h 40m', price:285, craft:'Pilatus PC-12', seats:6, amen:['WiFi','Snacks'], link:'flytradewind.com' },
  ],
  'SJU-AXA': [
    { id:'tw-sa1', airline:'Tradewind', dep:'8:30 AM', arr:'9:25 AM', dc:'SJU', ac:'AXA', dur:'0h 55m', price:325, craft:'Pilatus PC-12', seats:6, amen:['WiFi','Snacks'], link:'flytradewind.com' },
    { id:'tw-sa2', airline:'Tradewind', dep:'1:15 PM', arr:'2:10 PM', dc:'SJU', ac:'AXA', dur:'0h 55m', price:335, craft:'Pilatus PC-12', seats:5, amen:['WiFi','Snacks'], link:'flytradewind.com' },
  ],
  'AXA-SJU': [
    { id:'tw-as1', airline:'Tradewind', dep:'7:45 AM', arr:'8:40 AM', dc:'AXA', ac:'SJU', dur:'0h 55m', price:325, craft:'Pilatus PC-12', seats:6, amen:['WiFi','Snacks'], link:'flytradewind.com' },
    { id:'tw-as2', airline:'Tradewind', dep:'6:00 PM', arr:'6:55 PM', dc:'AXA', ac:'SJU', dur:'0h 55m', price:335, craft:'Pilatus PC-12', seats:5, amen:['WiFi','Snacks'], link:'flytradewind.com' },
  ],
  'SJU-SBH': [
    { id:'tw-ss1', airline:'Tradewind', dep:'8:45 AM', arr:'9:35 AM', dc:'SJU', ac:'SBH', dur:'0h 50m', price:345, craft:'Pilatus PC-12', seats:6, amen:['WiFi','Snacks'], link:'flytradewind.com' },
    { id:'tw-ss2', airline:'Tradewind', dep:'1:30 PM', arr:'2:20 PM', dc:'SJU', ac:'SBH', dur:'0h 50m', price:355, craft:'Pilatus PC-12', seats:5, amen:['WiFi','Snacks'], link:'flytradewind.com' },
    { id:'tw-ss3', airline:'Tradewind', dep:'5:00 PM', arr:'5:50 PM', dc:'SJU', ac:'SBH', dur:'0h 50m', price:335, craft:'Pilatus PC-12', seats:6, amen:['WiFi','Snacks'], link:'flytradewind.com' },
  ],
  'SBH-SJU': [
    { id:'tw-bs1', airline:'Tradewind', dep:'7:30 AM', arr:'8:20 AM', dc:'SBH', ac:'SJU', dur:'0h 50m', price:345, craft:'Pilatus PC-12', seats:6, amen:['WiFi','Snacks'], link:'flytradewind.com' },
    { id:'tw-bs2', airline:'Tradewind', dep:'12:00 PM', arr:'12:50 PM', dc:'SBH', ac:'SJU', dur:'0h 50m', price:335, craft:'Pilatus PC-12', seats:5, amen:['WiFi','Snacks'], link:'flytradewind.com' },
    { id:'tw-bs3', airline:'Tradewind', dep:'6:15 PM', arr:'7:05 PM', dc:'SBH', ac:'SJU', dur:'0h 50m', price:355, craft:'Pilatus PC-12', seats:6, amen:['WiFi','Snacks'], link:'flytradewind.com' },
  ],
  'FLL-MHH': [
    { id:'tw-fmh1', airline:'Tradewind', dep:'8:00 AM', arr:'8:50 AM', dc:'FLL', ac:'MHH', dur:'0h 50m', price:249, craft:'Pilatus PC-12', seats:6, amen:['WiFi','Snacks'], link:'flytradewind.com' },
    { id:'tw-fmh2', airline:'Tradewind', dep:'12:30 PM', arr:'1:20 PM', dc:'FLL', ac:'MHH', dur:'0h 50m', price:269, craft:'Pilatus PC-12', seats:5, amen:['WiFi','Snacks'], link:'flytradewind.com' },
    { id:'tw-fmh3', airline:'Tradewind', dep:'4:00 PM', arr:'4:50 PM', dc:'FLL', ac:'MHH', dur:'0h 50m', price:249, craft:'Pilatus PC-12', seats:6, amen:['WiFi','Snacks'], link:'flytradewind.com' },
  ],
  'MHH-FLL': [
    { id:'tw-mhf1', airline:'Tradewind', dep:'7:00 AM', arr:'7:50 AM', dc:'MHH', ac:'FLL', dur:'0h 50m', price:249, craft:'Pilatus PC-12', seats:6, amen:['WiFi','Snacks'], link:'flytradewind.com' },
    { id:'tw-mhf2', airline:'Tradewind', dep:'11:00 AM', arr:'11:50 AM', dc:'MHH', ac:'FLL', dur:'0h 50m', price:249, craft:'Pilatus PC-12', seats:5, amen:['WiFi','Snacks'], link:'flytradewind.com' },
    { id:'tw-mhf3', airline:'Tradewind', dep:'5:30 PM', arr:'6:20 PM', dc:'MHH', ac:'FLL', dur:'0h 50m', price:269, craft:'Pilatus PC-12', seats:6, amen:['WiFi','Snacks'], link:'flytradewind.com' },
  ],
  'FLL-ELH': [
    { id:'tw-fe1', airline:'Tradewind', dep:'8:15 AM', arr:'9:15 AM', dc:'FLL', ac:'ELH', dur:'1h 00m', price:249, craft:'Pilatus PC-12', seats:6, amen:['WiFi','Snacks'], link:'flytradewind.com' },
    { id:'tw-fe2', airline:'Tradewind', dep:'12:45 PM', arr:'1:45 PM', dc:'FLL', ac:'ELH', dur:'1h 00m', price:269, craft:'Pilatus PC-12', seats:5, amen:['WiFi','Snacks'], link:'flytradewind.com' },
  ],
  'ELH-FLL': [
    { id:'tw-ef1', airline:'Tradewind', dep:'7:30 AM', arr:'8:30 AM', dc:'ELH', ac:'FLL', dur:'1h 00m', price:249, craft:'Pilatus PC-12', seats:6, amen:['WiFi','Snacks'], link:'flytradewind.com' },
    { id:'tw-ef2', airline:'Tradewind', dep:'11:15 AM', arr:'12:15 PM', dc:'ELH', ac:'FLL', dur:'1h 00m', price:249, craft:'Pilatus PC-12', seats:5, amen:['WiFi','Snacks'], link:'flytradewind.com' },
  ],
};

// Seasonal/event-specific routes — flights only operate on these dates
// Coachella 2026: Apr 10–12 (Weekend 1), Apr 17–19 (Weekend 2)
export const SEASONAL_DATES: Record<string, string[]> = {
  // Aero VNY↔TRM: Real dates from aero.com (Apr 2026, Coachella season)
  'VNY-TRM': ['2026-04-09','2026-04-10','2026-04-12','2026-04-13','2026-04-16','2026-04-17','2026-04-19','2026-04-20','2026-04-23','2026-04-24','2026-04-26','2026-04-27'],
  'TRM-VNY': ['2026-04-09','2026-04-10','2026-04-12','2026-04-13','2026-04-16','2026-04-17','2026-04-19','2026-04-20','2026-04-23','2026-04-24','2026-04-26','2026-04-27'],
  // JSX: Thu Apr 9 outbound, Mon Apr 13 return
  'SMO-TRM': ['2026-04-09'],
  'TRM-SMO': ['2026-04-13'],
  // Aero VNY→NYC: Real dates from aero.com (Feb–Sep 2026)
  'VNY-TEB': [
    '2026-02-23',
    '2026-03-02','2026-03-09','2026-03-16','2026-03-23','2026-03-30',
    '2026-04-06','2026-04-09','2026-04-13','2026-04-16','2026-04-20','2026-04-23','2026-04-27','2026-04-30',
    '2026-05-03','2026-05-07','2026-05-11','2026-05-14','2026-05-18','2026-05-21','2026-05-27','2026-05-28',
    '2026-06-01','2026-06-04','2026-06-05','2026-06-08','2026-06-11','2026-06-12','2026-06-15','2026-06-18','2026-06-19','2026-06-22','2026-06-25','2026-06-26','2026-06-29',
    '2026-07-02','2026-07-03','2026-07-06','2026-07-09','2026-07-10','2026-07-13','2026-07-16','2026-07-17','2026-07-20','2026-07-23','2026-07-24','2026-07-27','2026-07-30','2026-07-31',
    '2026-08-03','2026-08-06','2026-08-07','2026-08-10','2026-08-13','2026-08-14','2026-08-17','2026-08-20','2026-08-21','2026-08-24','2026-08-27','2026-08-28','2026-08-31',
    '2026-09-03','2026-09-04','2026-09-07','2026-09-10','2026-09-11',
  ],
  // Aero VNY→LAS: Real dates from aero.com (Mar–Sep 2026)
  'VNY-LAS': [
    '2026-03-06','2026-03-08','2026-03-20','2026-03-22',
    '2026-04-17','2026-04-19','2026-04-24','2026-04-26',
    '2026-05-01','2026-05-03','2026-05-15','2026-05-17',
    '2026-09-11','2026-09-13',
  ],
  // Aero LAS→VNY: Real dates from aero.com (Mar–Sep 2026)
  'LAS-VNY': [
    '2026-03-06','2026-03-08','2026-03-20','2026-03-22',
    '2026-04-17','2026-04-19','2026-04-24','2026-04-26',
    '2026-05-01','2026-05-03','2026-05-15','2026-05-17',
    '2026-09-11','2026-09-13',
  ],
  // Aero VNY→ASE: Real dates from aero.com (Feb–Sep 2026)
  // ASE closed Apr 23 – May 21, 2026 for pavement maintenance
  'VNY-ASE': [
    '2026-02-12','2026-02-13','2026-02-15','2026-02-16','2026-02-17','2026-02-19','2026-02-20','2026-02-21','2026-02-22','2026-02-23','2026-02-26','2026-02-27',
    '2026-03-01','2026-03-02','2026-03-05','2026-03-06','2026-03-08','2026-03-09','2026-03-12','2026-03-13','2026-03-15','2026-03-16','2026-03-19','2026-03-20','2026-03-22','2026-03-23','2026-03-26','2026-03-27','2026-03-29','2026-03-30',
    '2026-04-02','2026-04-03','2026-04-05','2026-04-06','2026-04-09','2026-04-10','2026-04-12','2026-04-13','2026-04-16','2026-04-17','2026-04-19','2026-04-20',
    '2026-05-22','2026-05-24','2026-05-25','2026-05-28','2026-05-31',
    '2026-06-01','2026-06-04','2026-06-07','2026-06-08','2026-06-11','2026-06-14','2026-06-15','2026-06-18','2026-06-21','2026-06-22','2026-06-25','2026-06-26','2026-06-28','2026-06-29',
    '2026-07-02','2026-07-03','2026-07-05','2026-07-06','2026-07-09','2026-07-10','2026-07-12','2026-07-13','2026-07-16','2026-07-17','2026-07-19','2026-07-20','2026-07-23','2026-07-24','2026-07-26','2026-07-27','2026-07-30','2026-07-31',
    '2026-08-02','2026-08-03','2026-08-06','2026-08-07','2026-08-09','2026-08-10','2026-08-13','2026-08-14','2026-08-16','2026-08-17','2026-08-20','2026-08-21','2026-08-23','2026-08-24','2026-08-27','2026-08-28','2026-08-30','2026-08-31',
    '2026-09-03','2026-09-04','2026-09-06','2026-09-07','2026-09-10','2026-09-11','2026-09-13',
  ],
  // Aero ASE→VNY: Real dates from aero.com (Feb–Sep 2026)
  'ASE-VNY': [
    '2026-02-12','2026-02-13','2026-02-15','2026-02-16','2026-02-19','2026-02-20','2026-02-21','2026-02-22','2026-02-23','2026-02-26','2026-02-27',
    '2026-03-01','2026-03-02','2026-03-05','2026-03-06','2026-03-08','2026-03-09','2026-03-12','2026-03-13','2026-03-15','2026-03-16','2026-03-19','2026-03-20','2026-03-22','2026-03-23','2026-03-26','2026-03-27','2026-03-29','2026-03-30',
    '2026-04-02','2026-04-03','2026-04-05','2026-04-06','2026-04-09','2026-04-10','2026-04-12','2026-04-13','2026-04-16','2026-04-17','2026-04-19','2026-04-20',
    '2026-05-22','2026-05-24','2026-05-25','2026-05-28','2026-05-31',
    '2026-06-01','2026-06-04','2026-06-07','2026-06-08','2026-06-11','2026-06-14','2026-06-15','2026-06-18','2026-06-21','2026-06-22','2026-06-25','2026-06-26','2026-06-28','2026-06-29',
    '2026-07-02','2026-07-03','2026-07-05','2026-07-06','2026-07-09','2026-07-10','2026-07-12','2026-07-13','2026-07-16','2026-07-17','2026-07-19','2026-07-20','2026-07-23','2026-07-24','2026-07-26','2026-07-27','2026-07-30','2026-07-31',
    '2026-08-02','2026-08-03','2026-08-06','2026-08-07','2026-08-09','2026-08-10','2026-08-13','2026-08-14','2026-08-16','2026-08-17','2026-08-20','2026-08-21','2026-08-23','2026-08-24','2026-08-27','2026-08-28','2026-08-30','2026-08-31',
    '2026-09-03','2026-09-04','2026-09-06','2026-09-07','2026-09-10','2026-09-11','2026-09-13',
  ],
  // Aero VNY→APC (Napa): Real dates from aero.com (Apr 2026 only)
  'VNY-APC': ['2026-04-24'],
  // Aero APC→VNY (Napa): Real dates from aero.com (Apr 2026 only)
  'APC-VNY': ['2026-04-24'],
  // Aero VNY→SUN (Sun Valley): Real dates from aero.com (Feb–Apr 2026)
  'VNY-SUN': [
    '2026-02-12','2026-02-16',
    '2026-03-01','2026-03-05','2026-03-08','2026-03-12','2026-03-15','2026-03-19','2026-03-22','2026-03-26','2026-03-29',
    '2026-04-02','2026-04-05',
  ],
  // Aero SUN→VNY (Sun Valley): Real dates from aero.com (Feb–Apr 2026)
  'SUN-VNY': [
    '2026-02-12','2026-02-16',
    '2026-03-01','2026-03-05','2026-03-08','2026-03-12','2026-03-15','2026-03-19','2026-03-22','2026-03-26','2026-03-29',
    '2026-04-02','2026-04-05',
  ],
  // Aero VNY→OGG (Maui): Real dates from aero.com (Saturdays, Feb–Aug 2026)
  'VNY-OGG': [
    '2026-02-14','2026-02-21','2026-02-28',
    '2026-03-07','2026-03-14','2026-03-21','2026-03-28',
    '2026-04-04','2026-04-11','2026-04-18','2026-04-25',
    '2026-05-02','2026-05-09','2026-05-16','2026-05-23','2026-05-30',
    '2026-06-06','2026-06-13','2026-06-20','2026-06-27',
    '2026-07-04','2026-07-11','2026-07-18','2026-07-25',
    '2026-08-01',
  ],
  // Aero OGG→VNY (Maui): Real dates from aero.com (Sundays, Feb–Aug 2026)
  'OGG-VNY': [
    '2026-02-16','2026-02-22',
    '2026-03-08','2026-03-15','2026-03-22','2026-03-30',
    '2026-04-05','2026-04-12','2026-04-19','2026-04-26',
    '2026-05-03','2026-05-10','2026-05-17','2026-05-24','2026-05-31',
    '2026-06-07','2026-06-14','2026-06-21','2026-06-28',
    '2026-07-05','2026-07-12','2026-07-19','2026-07-26',
    '2026-08-02',
  ],
  // Aero VNY→SJD: Real dates from aero.com (Feb–Jul 2026)
  // Mexican authorities require passengers departing Mexico via SJD with Aero have previously entered Mexico from SJD with Aero
  'VNY-SJD': [
    '2026-02-12','2026-02-16','2026-02-19','2026-02-22','2026-02-26',
    '2026-03-01','2026-03-02','2026-03-05','2026-03-08','2026-03-09','2026-03-12','2026-03-13','2026-03-15','2026-03-16','2026-03-19','2026-03-20','2026-03-22','2026-03-23','2026-03-26','2026-03-27','2026-03-29','2026-03-30',
    '2026-04-02','2026-04-03','2026-04-05','2026-04-06','2026-04-09','2026-04-10','2026-04-12','2026-04-13','2026-04-16','2026-04-17','2026-04-19','2026-04-20','2026-04-23','2026-04-24','2026-04-26','2026-04-30',
    '2026-05-03','2026-05-07','2026-05-10','2026-05-14','2026-05-17','2026-05-21','2026-05-25','2026-05-28','2026-05-31',
    '2026-06-04','2026-06-07','2026-06-11','2026-06-14','2026-06-18','2026-06-21','2026-06-25','2026-06-28',
    '2026-07-02','2026-07-05','2026-07-09','2026-07-12','2026-07-16','2026-07-19','2026-07-23','2026-07-26',
  ],
  // Aero SJD→VNY: Real dates from aero.com (Mar–Jul 2026)
  'SJD-VNY': [
    '2026-03-01','2026-03-02','2026-03-05','2026-03-08','2026-03-09','2026-03-12','2026-03-15','2026-03-16','2026-03-19','2026-03-20','2026-03-22','2026-03-23','2026-03-26','2026-03-27','2026-03-29','2026-03-30',
    '2026-04-02','2026-04-03','2026-04-05','2026-04-06','2026-04-09','2026-04-10','2026-04-13','2026-04-16','2026-04-17','2026-04-19','2026-04-20','2026-04-23','2026-04-24','2026-04-26','2026-04-30',
    '2026-05-03','2026-05-07','2026-05-10','2026-05-14','2026-05-17','2026-05-21','2026-05-25','2026-05-28','2026-05-31',
    '2026-06-04','2026-06-07','2026-06-11','2026-06-14','2026-06-18','2026-06-21','2026-06-25','2026-06-28',
    '2026-07-02','2026-07-05','2026-07-09','2026-07-12','2026-07-16','2026-07-19','2026-07-23','2026-07-26',
  ],
  // Aero NYC→VNY: Real dates from aero.com (Feb–Sep 2026)
  'TEB-VNY': [
    '2026-02-26',
    '2026-03-05','2026-03-12','2026-03-19','2026-03-26',
    '2026-04-02','2026-04-09','2026-04-13','2026-04-16','2026-04-20','2026-04-23','2026-04-27','2026-04-30',
    '2026-05-04','2026-05-07','2026-05-11','2026-05-14','2026-05-18','2026-05-21','2026-05-25','2026-05-28',
    '2026-06-01','2026-06-04','2026-06-05','2026-06-08','2026-06-11','2026-06-12','2026-06-15','2026-06-18','2026-06-19','2026-06-22','2026-06-25','2026-06-26','2026-06-29',
    '2026-07-02','2026-07-03','2026-07-06','2026-07-09','2026-07-10','2026-07-13','2026-07-16','2026-07-17','2026-07-20','2026-07-23','2026-07-27','2026-07-30','2026-07-31',
    '2026-08-03','2026-08-06','2026-08-07','2026-08-10','2026-08-13','2026-08-14','2026-08-17','2026-08-20','2026-08-21','2026-08-24','2026-08-27','2026-08-28','2026-08-31',
    '2026-09-03','2026-09-04','2026-09-07','2026-09-10','2026-09-11',
  ],
};

// Returns sorted list of operating dates for a route, or null if flights run daily
export const getRouteDates = (fromCode: string, toCode: string): string[] | null => {
  const fromCodes = expandCode(fromCode);
  const toCodes = expandCode(toCode);
  let allDates: string[] = [];
  let hasAnyFlights = false;
  let allAreSeasonal = true;
  for (const fc of fromCodes) {
    for (const tc of toCodes) {
      const key = `${fc}-${tc}`;
      if (FLIGHTS[key] && FLIGHTS[key].length > 0) {
        hasAnyFlights = true;
        if (SEASONAL_DATES[key]) {
          allDates = [...allDates, ...SEASONAL_DATES[key]];
        } else {
          // This sub-route runs daily — no date restriction
          allAreSeasonal = false;
        }
      }
    }
  }
  if (hasAnyFlights && allAreSeasonal && allDates.length > 0) {
    return [...new Set(allDates)].sort();
  }
  return null;
};

export const getMetroAreaFlights = (fromCode: string, toCode: string, date?: string): Flight[] => {
  const fromCodes = expandCode(fromCode);
  const toCodes = expandCode(toCode);
  let allFlights: Flight[] = [];
  for (const fc of fromCodes) {
    for (const tc of toCodes) {
      const key = `${fc}-${tc}`;
      const flights = FLIGHTS[key] || [];
      if (flights.length === 0) continue;
      // If this sub-route is seasonal and a date is provided, only include if it operates that day
      if (date && SEASONAL_DATES[key]) {
        if (SEASONAL_DATES[key].includes(date)) {
          allFlights = [...allFlights, ...flights];
        }
      } else {
        // For date-specific flights (e.g. Slate), filter to matching date
        // For non-dated flights (e.g. JSX daily service), always include
        if (date) {
          const dated = flights.filter(f => f.date === date);
          const undated = flights.filter(f => !f.date);
          allFlights = [...allFlights, ...undated, ...dated];
        } else {
          allFlights = [...allFlights, ...flights];
        }
      }
    }
  }
  return allFlights;
};
