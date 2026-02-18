'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
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

        <h1 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 8px' }}>Privacy Policy</h1>
        <p style={{ fontSize: '14px', color: '#9B9B93', margin: '0 0 40px' }}>Last updated: February 18, 2026</p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 32px 80px', lineHeight: 1.75, fontSize: '15px', color: '#333' }}>
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 12px' }}>Overview</h2>
          <p style={{ margin: 0 }}>
            Aviato respects your privacy. This Privacy Policy explains what information we collect, how we use it, and your rights regarding that information. We are committed to transparency and protecting your personal data.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 12px' }}>1. Information We Collect</h2>
          <p style={{ margin: '0 0 12px' }}>
            <strong>Information you provide:</strong> Aviato is primarily a search tool — we do not require you to create an account, and we do not collect personal information such as your name, email address, or payment details. Any information you provide voluntarily (such as through a contact form) will only be used for the stated purpose.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Automatically collected information:</strong> When you use Aviato, we may automatically collect certain technical information, including your IP address, browser type, device type, operating system, referring URL, pages viewed, and the date and time of your visit. This information is collected through standard web technologies and is used to improve the Service.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 12px' }}>2. How We Use Your Information</h2>
          <p style={{ margin: 0 }}>
            We use automatically collected information to operate, maintain, and improve the Service; analyze usage patterns and trends; ensure the security and integrity of the platform; and fix bugs and technical issues. We do not sell, rent, or trade your personal information to third parties.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 12px' }}>3. Cookies and Tracking</h2>
          <p style={{ margin: 0 }}>
            Aviato may use cookies and similar technologies to enhance your experience, remember your preferences (such as theme settings), and gather analytics data. You can control cookie settings through your browser preferences. Disabling cookies may affect certain features of the Service.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 12px' }}>4. Third-Party Services</h2>
          <p style={{ margin: 0 }}>
            When you click through to a third-party airline website from Aviato, you leave our platform and become subject to that airline's own privacy policy. We encourage you to read the privacy policies of any third-party sites you visit. Aviato is not responsible for the privacy practices or content of third-party websites. We may use third-party analytics services (such as Google Analytics) that collect and process data on our behalf.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 12px' }}>5. Data Security</h2>
          <p style={{ margin: 0 }}>
            We take reasonable measures to protect any information collected through the Service. However, no method of electronic storage or transmission over the internet is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 12px' }}>6. Children's Privacy</h2>
          <p style={{ margin: 0 }}>
            Aviato is not directed at children under the age of 13. We do not knowingly collect personal information from children. If we become aware that we have inadvertently collected information from a child under 13, we will take steps to delete it promptly.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 12px' }}>7. Your Rights</h2>
          <p style={{ margin: 0 }}>
            Depending on your location, you may have certain rights regarding your personal data, including the right to access, correct, or delete information we hold about you, and the right to opt out of certain data processing. To exercise any of these rights, please contact us using the information below.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 12px' }}>8. Changes to This Policy</h2>
          <p style={{ margin: 0 }}>
            We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated "Last updated" date. Your continued use of the Service after changes are posted constitutes your acceptance of the updated policy.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 12px' }}>9. Contact</h2>
          <p style={{ margin: 0 }}>
            If you have any questions about this Privacy Policy, please contact us at the email address provided on our website.
          </p>
        </section>
      </div>
    </div>
  );
}
