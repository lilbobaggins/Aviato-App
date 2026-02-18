'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: '100vh', fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      backgroundColor: '#FFFCF2', color: '#1A1A1A',
    }}>
      {/* Header */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 32px 0' }}>
        <button onClick={() => router.back()} style={{
          display: 'flex', alignItems: 'center', gap: '6px', border: 'none', background: 'none',
          cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#0A3D2E', marginBottom: '32px',
          fontFamily: 'inherit',
        }}>
          <ArrowLeft style={{ width: '16px', height: '16px' }} /> Back
        </button>

        <h1 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 8px' }}>Terms of Service</h1>
        <p style={{ fontSize: '14px', color: '#9B9B93', margin: '0 0 40px' }}>Last updated: February 18, 2026</p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 32px 80px', lineHeight: 1.75, fontSize: '15px', color: '#333' }}>
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 12px' }}>1. Acceptance of Terms</h2>
          <p style={{ margin: 0 }}>
            By accessing or using Aviato ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service. Aviato reserves the right to modify these terms at any time, and your continued use of the Service constitutes acceptance of any changes.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 12px' }}>2. Description of Service</h2>
          <p style={{ margin: 0 }}>
            Aviato is a flight search and comparison platform that aggregates publicly available semi-private and charter flight information from third-party airlines. Aviato does not sell tickets, operate flights, or act as a travel agent. We provide links to third-party airline websites where users may complete their bookings directly. All bookings are subject to the respective airline's own terms, conditions, and pricing.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 12px' }}>3. No Guarantee of Accuracy</h2>
          <p style={{ margin: 0 }}>
            While we strive to provide accurate and up-to-date flight information, Aviato makes no warranties or representations regarding the accuracy, completeness, or reliability of any flight data, pricing, availability, or scheduling information displayed on the platform. Prices and availability are subject to change without notice and may differ from what is shown on the Service. Always verify details directly with the airline before booking.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 12px' }}>4. Intellectual Property</h2>
          <p style={{ margin: 0 }}>
            All content on Aviato — including but not limited to the website design, user interface, layout, graphics, data compilation, software, code, and original text — is the intellectual property of Aviato and is protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, modify, create derivative works from, or commercially exploit any content from the Service without prior written permission. The aggregation and presentation of flight data on Aviato constitutes a protected compilation under copyright law.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 12px' }}>5. Prohibited Use</h2>
          <p style={{ margin: '0 0 12px' }}>You agree not to:</p>
          <p style={{ margin: 0, paddingLeft: '16px' }}>
            Scrape, crawl, or otherwise extract data from the Service by automated means; reverse engineer, decompile, or disassemble any part of the Service; use the Service for any unlawful purpose; attempt to gain unauthorized access to any systems or networks connected to the Service; reproduce, duplicate, or copy any part of the Service for commercial purposes; or interfere with or disrupt the integrity or performance of the Service.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 12px' }}>6. Third-Party Links and Services</h2>
          <p style={{ margin: 0 }}>
            Aviato contains links to third-party airline websites. These links are provided for your convenience only. Aviato has no control over the content, policies, or practices of third-party websites and assumes no responsibility for them. Your interactions with third-party airlines — including purchases, disputes, and personal data sharing — are solely between you and the respective airline.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 12px' }}>7. Limitation of Liability</h2>
          <p style={{ margin: 0 }}>
            To the fullest extent permitted by law, Aviato shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from or related to your use of the Service. This includes, without limitation, damages for loss of profits, data, bookings, or other intangible losses, even if Aviato has been advised of the possibility of such damages. Aviato's total liability shall not exceed the amount you paid, if any, to access the Service.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 12px' }}>8. Disclaimer of Warranties</h2>
          <p style={{ margin: 0 }}>
            The Service is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied. Aviato disclaims all warranties, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Service will be uninterrupted, secure, or error-free.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 12px' }}>9. Indemnification</h2>
          <p style={{ margin: 0 }}>
            You agree to indemnify and hold harmless Aviato, its founders, employees, and affiliates from any claims, damages, losses, liabilities, costs, and expenses (including attorney's fees) arising from your use of the Service, your violation of these terms, or your infringement of any third-party rights.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 12px' }}>10. Governing Law</h2>
          <p style={{ margin: 0 }}>
            These Terms shall be governed by and construed in accordance with the laws of the United States. Any disputes arising under these terms shall be resolved in the appropriate courts within the United States.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 12px' }}>11. Contact</h2>
          <p style={{ margin: 0 }}>
            If you have any questions about these Terms of Service, please contact us at the email address provided on our website.
          </p>
        </section>
      </div>
    </div>
  );
}
