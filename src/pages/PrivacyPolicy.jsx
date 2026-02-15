import { Link, useNavigate } from 'react-router-dom'

const Section = ({ title, children }) => (
  <section style={{ marginBottom: '1.5rem' }}>
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
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.25rem' }}>Privacy Policy</h1>
      <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Effective Date: June 24, 2025</p>

      <P>
        CollectorIQ ("we," "our," "us") is committed to protecting your privacy. This Privacy Policy outlines how your personal information is collected, used, and disclosed when you use our app across all jurisdictions including Canada, the United States, the European Union, and any other applicable regions. CollectorIQ is designed to help watch enthusiasts track and analyze the performance of their watches. By signing up and using the app, you agree to all terms of this Privacy Policy, including the collection, use, and processing of your data as described herein. This document also serves as our Terms of Service, governing your use of CollectorIQ.
      </P>

      <Section title="Consent Upon Sign-Up">
        <P>By creating an account or using CollectorIQ, you explicitly consent to the collection and use of your personal and watch performance data as outlined in this Privacy Policy. If you do not agree with any part of this policy, please do not use the app.</P>
      </Section>

      <Section title="1. Information We Collect">
        <P>We may collect the following information:</P>
        <List items={[
          'Identifiers such as name, email address, and user ID',
          'Device data including model, OS, and diagnostics',
          'App usage data, including performance and error logs',
          'Location data (if enabled)',
          'User-submitted watch performance data such as timing measurements and related notes',
        ]} />
      </Section>

      <Section title="2. Use of Information">
        <P>Your information is used to:</P>
        <List items={[
          'Operate and improve the app',
          'Authenticate and secure user accounts',
          'Provide watch tracking, notification, and analysis features',
          'Benchmark your watch\'s performance against manufacturer specifications and other users',
          'Communicate with you regarding service, updates, and optional marketing communications',
          'Comply with legal obligations',
        ]} />
      </Section>

      <Section title="3. Legal Basis for Processing">
        <P>We process your data under lawful bases, including consent, performance of a contract, legal obligations, and legitimate interests.</P>
      </Section>

      <Section title="4. Sharing of Information">
        <P>We do not sell your data. We may share your data with:</P>
        <List items={[
          'Service providers like Firebase for hosting and analytics',
          'Authentication partners such as Google, Apple, and Meta',
          'Legal authorities if required by law or to protect rights and safety',
          'Anonymized and aggregated data for analytics and product improvement purposes',
        ]} />
      </Section>

      <Section title="5. International Transfers">
        <P>Your information may be transferred and processed outside your country of residence. We ensure appropriate safeguards are in place as required by applicable law (e.g., Standard Contractual Clauses in the EU).</P>
      </Section>

      <Section title="6. Data Retention">
        <P>We retain personal data only for as long as necessary to fulfill the purposes outlined in this policy or as required by law.</P>
      </Section>

      <Section title="7. Your Rights">
        <P>Depending on your jurisdiction, you have rights including:</P>
        <List items={[
          'Accessing your data',
          'Correcting inaccurate data',
          'Deleting your data',
          'Objecting to or limiting data processing',
          'Data portability',
          'Withdrawing consent',
        ]} />
        <P>To exercise your rights, email us at support@collectoriq.app</P>
      </Section>

      <Section title="8. Security">
        <P>We implement technical and organizational measures to protect your data, but no system is completely secure. Users are responsible for safeguarding their login credentials. Watch performance data is never publicly shared or sold, ensuring your personal measurements remain confidential.</P>
      </Section>

      <Section title="9. User-Submitted Watch Performance Data">
        <P>The watch performance data you submit is used solely to provide personalized analysis and benchmarking features within the app. This data is stored securely and is protected with encryption and access controls. We do not share your individual watch performance data with third parties except as described in this policy.</P>
      </Section>

      <Section title="10. Children">
        <P>CollectorIQ is not intended for users under the age of 13. We do not knowingly collect personal data from children without parental consent.</P>
      </Section>

      <Section title="11. Optional Marketing Communications">
        <P>We may send you marketing emails or notifications about new features and offers. You can opt out of these communications at any time by following the unsubscribe instructions included in the messages or by contacting us.</P>
      </Section>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: '1.5rem', marginBottom: '0.75rem', color: 'var(--text)' }}>Terms of Service</h2>

      <Section title="User Responsibilities">
        <P>Users agree to use CollectorIQ only for lawful purposes and not misuse the service.</P>
      </Section>

      <Section title="Account Termination">
        <P>We reserve the right to suspend or terminate accounts that violate the policy or misuse the app.</P>
      </Section>

      <Section title="Intellectual Property">
        <P>CollectorIQ's concept — including but not limited to the housing of watch movement specifications, automated comparison of user-submitted timing data against those specifications, and the generation of service suggestions based on such comparisons — is the original intellectual property of CollectorIQ. All content within the app, including designs, logos, copy, data models, and timing analysis tools, is owned by CollectorIQ and protected by applicable copyright, trademark, and intellectual property laws. Any reproduction, modification, distribution, reverse engineering, or unauthorized use of this intellectual property is strictly prohibited and may result in legal action.</P>
      </Section>

      <Section title="Warranty Disclaimer">
        <P>The app is provided "as is" with no warranties of accuracy or fitness for a particular purpose.</P>
      </Section>

      <Section title="Limitation of Liability">
        <P>We are not liable for any loss or damage from the use or inability to use the app.</P>
      </Section>

      <Section title="12. Changes to This Policy">
        <P>We may update this policy periodically. We will notify you of material changes through the app or other means. Continued use of the app constitutes acceptance of the revised policy.</P>
      </Section>

      <Section title="Contact Us">
        <P>If you have any questions or concerns, contact us at: support@collectoriq.app</P>
      </Section>

      <P style={{ marginTop: '1.5rem' }}>By using CollectorIQ, you consent to this Privacy Policy.</P>
    </div>
  )
}
