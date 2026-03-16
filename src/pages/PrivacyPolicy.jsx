import { Link, useNavigate } from 'react-router-dom'

const Section = ({ title, id, children }) => (
  <section id={id} style={{ marginBottom: '1.5rem' }}>
    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text)' }}>{title}</h2>
    <div style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{children}</div>
  </section>
)

const P = ({ children }) => <p style={{ margin: '0 0 0.75rem' }}>{children}</p>
const List = ({ items }) => (
  <ul style={{ margin: '0 0 0.75rem', paddingLeft: '1.25rem' }}>
    {items.map((item, i) => (
      <li key={i} style={{ marginBottom: '0.25rem' }}>{item}</li>
    ))}
  </ul>
)

export default function PrivacyPolicy() {
  const navigate = useNavigate()
  return (
    <div className="app-main" style={{ paddingBottom: '2rem' }}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{ fontSize: 15, color: 'var(--accent)', marginBottom: '1rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        ← Back
      </button>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.25rem' }}>Terms &amp; Privacy Policy</h1>
      <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Effective Date: February 15, 2025</p>

      <P>
        CollectorIQ ("we," "our," "us") is a watch accuracy tracking app. This document combines our Privacy Policy and Terms of Service. By creating an account or using the app, you agree to all terms below. If you do not agree, do not use CollectorIQ.
      </P>

      <Section title="1. Information We Collect">
        <P>We collect the following:</P>
        <List items={[
          'Account information: email, display name (nickname), and Firebase user ID',
          'Watch data: brand, model, reference, drift readings (timing measurements, position, timestamps), and notes you add',
          'Payment-related data: On web, Stripe processes payment; on iOS, Apple processes in-app purchases. We do not store or access your full payment card details.',
          'Usage data: Firebase Analytics and Vercel Analytics may collect anonymized usage metrics (e.g., page views, feature usage) to improve the app.',
          'Authentication: When you sign in with Google or Apple, we receive your email and name from the provider.',
        ]} />
        <P>We do not collect your precise location. We do not sell your personal data.</P>
      </Section>

      <Section title="2. How We Use Your Information">
        <P>Your information is used to:</P>
        <List items={[
          'Operate and improve the app',
          'Authenticate and secure your account',
          'Provide watch tracking, drift testing, and analysis features',
          'Benchmark your watch against manufacturer specs and anonymized community data',
          'Process subscriptions (web: Stripe; iOS: Apple)',
          'Respond to support requests (e.g., via support@collectoriq.app)',
          'Comply with legal obligations',
        ]} />
      </Section>

      <Section title="3. Community Data">
        <P>When you run drift tests, anonymized readings may contribute to aggregate statistics (e.g., median accuracy by watch model) shown in Discovery. No personally identifiable information is included in these aggregates. Your individual readings remain private.</P>
      </Section>

      <Section title="4. Sharing of Information">
        <P>We do not sell your data. We may share it with:</P>
        <List items={[
          'Firebase (Google) — hosting, authentication, database',
          'Google and Apple — authentication when you sign in with those providers',
          'Stripe — payment processing on web',
          'Apple — in-app purchase processing on iOS',
          'Vercel — hosting and analytics',
          'Legal authorities — when required by law or to protect rights and safety',
        ]} />
      </Section>

      <Section title="5. Legal Basis (GDPR)">
        <P>For users in the EU/EEA, we process your data based on: consent (when you sign up), performance of a contract (providing the service), and legitimate interests (improving the app, security).</P>
      </Section>

      <Section title="6. International Transfers">
        <P>Your data may be processed outside your country. We use appropriate safeguards (e.g., Standard Contractual Clauses for EU transfers) as required by law.</P>
      </Section>

      <Section title="7. Data Retention">
        <P>We retain your data for as long as your account is active or as needed to provide the service. You may request deletion by contacting support@collectoriq.app.</P>
      </Section>

      <Section title="8. Your Rights">
        <P>Depending on where you live, you may have the right to:</P>
        <List items={[
          'Access your data',
          'Correct inaccurate data',
          'Delete your data',
          'Object to or restrict processing',
          'Data portability',
          'Withdraw consent',
          'Lodge a complaint with a supervisory authority (EU)',
        ]} />
        <P><strong>California (CCPA):</strong> We do not sell personal information. You may request to know what we collect and to delete it. Contact support@collectoriq.app.</P>
        <P>To exercise any rights, email support@collectoriq.app.</P>
      </Section>

      <Section title="9. Security">
        <P>We use industry-standard measures to protect your data. No system is completely secure. You are responsible for keeping your login credentials safe. Do not share your password.</P>
      </Section>

      <Section title="10. Children">
        <P>CollectorIQ is not intended for users under 13. We do not knowingly collect data from children under 13. If you believe we have collected such data, contact us and we will delete it.</P>
      </Section>

      <Section title="11. Marketing">
        <P>We may send service-related emails (e.g., password reset, subscription updates). We may send optional marketing about new features. You can opt out anytime by contacting us or using unsubscribe links in emails.</P>
      </Section>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: '1.5rem', marginBottom: '0.75rem', color: 'var(--text)' }}>Terms of Service</h2>

      <Section title="User Responsibilities">
        <P>You agree to use CollectorIQ only for lawful purposes. You may not:</P>
        <List items={[
          'Violate any applicable law',
          'Impersonate others or provide false information',
          'Attempt to gain unauthorized access to our systems or other users\' accounts',
          'Scrape, reverse-engineer, or extract data from the app without permission',
          'Use the app to harm, harass, or defraud others',
        ]} />
      </Section>

      <Section title="Account Termination">
        <P>We may suspend or terminate your account if you violate these terms or misuse the app. You may terminate your account at any time by contacting us or deleting your data.</P>
      </Section>

      <Section title="Intellectual Property">
        <P>CollectorIQ's concept — including watch movement specifications, timing analysis tools, data models, designs, logos, and copy — is our intellectual property. You may not reproduce, modify, distribute, reverse-engineer, or otherwise use our IP without permission.</P>
      </Section>

      <Section title="Warranty Disclaimer">
        <P>THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE APP WILL BE ACCURATE, UNINTERRUPTED, OR ERROR-FREE. TIMING MEASUREMENTS ARE FOR INFORMATIONAL PURPOSES ONLY AND SHOULD NOT REPLACE PROFESSIONAL WATCHMAKER SERVICES.</P>
      </Section>

      <Section title="Limitation of Liability">
        <P>TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE (AND OUR AFFILIATES, OFFICERS, PARTNERS, AND EMPLOYEES) SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OR INABILITY TO USE THE APP. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS BEFORE THE CLAIM.</P>
      </Section>

      <Section title="Governing Law">
        <P>These terms are governed by the laws of Canada unless your jurisdiction requires otherwise. Any disputes shall be resolved in the courts of Canada.</P>
      </Section>

      <Section title="Severability">
        <P>If any provision of these terms is found unenforceable, the remaining provisions remain in effect.</P>
      </Section>

      <Section title="Entire Agreement">
        <P>These terms are the entire agreement between you and CollectorIQ regarding the app and supersede any prior agreements.</P>
      </Section>

      <Section title="Apple-Specific Terms">
        <P>If you use the iOS app: (a) These terms are between you and CollectorIQ, not Apple. (b) Apple has no obligation to provide maintenance or support. (c) Apple is not responsible for any claims relating to the app. (d) Apple and its subsidiaries are third-party beneficiaries of these terms and may enforce them against you.</P>
      </Section>

      <Section title="12. Changes to This Policy">
        <P>We may update this policy. Continued use after changes constitutes acceptance. We will notify you of material changes via the app or email where possible.</P>
      </Section>

      <Section title="Refunds" id="refunds">
        <P><strong>Web (Stripe):</strong> You may request a refund within 14 days of the charge. Email support@collectoriq.app with your account email and charge date. We will process within 5 business days to the original payment method.</P>
        <P><strong>iOS (Apple):</strong> Refunds are handled by Apple. Go to reportaproblem.apple.com or contact Apple Support.</P>
        <P>If you cancel before your next billing date, you will not be charged again.</P>
      </Section>

      <Section title="Cancellations">
        <P>Subscriptions automatically renew until cancelled. You can cancel your subscription at any time. To cancel:</P>
        <List items={[
          'iOS: Settings → [Your Name] → Subscriptions → Collector IQ → Cancel.',
          'Web: Settings → Manage subscription (opens our billing portal), or',
          'Email us at support@collectoriq.app and we will cancel for you.',
        ]} />
        <P>After canceling, you will keep access until the end of your current billing period. When your subscription ends, you will still have access to your first watch and all its data; adding additional watches will require a new subscription.</P>
      </Section>

      <Section title="Subscription questions &amp; support">
        <P>For questions about subscriptions, billing, refunds, or any other support:</P>
        <P><strong>Email:</strong> support@collectoriq.app</P>
        <P>We aim to respond within 1–2 business days.</P>
      </Section>

      <Section title="Contact Us">
        <P>If you have any other questions or concerns, contact us at: support@collectoriq.app</P>
      </Section>

      <P style={{ marginTop: '1.5rem' }}>By using CollectorIQ, you agree to these Terms and Privacy Policy.</P>
    </div>
  )
}
