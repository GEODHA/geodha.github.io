import React from "react";

const PrivacyPolicy: React.FC = () => {
  const now = new Date();
  const lastUpdated = now.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header / Hero */}
      <section className="py-16 bg-gradient-subtle">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">
              Privacy Policy {" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                | GEODHA
              </span>
            </h1>
            <p className="text-sm text-muted-foreground">Effective Date: 17 October 2025</p>
            <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>
        </div>
      </section>

      {/* Linked index */}
      <section className="py-6">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-sm text-muted-foreground">
            <nav className="flex space-x-4 justify-center">
              <a href="#privacy-policy" className="hover:text-primary">1. Privacy Policy</a>
              <a href="#account-deletion" className="hover:text-primary">2. Account Deletion</a>
            </nav>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto prose prose-lg text-muted-foreground">
            <h2 id="privacy-policy">1. Introduction</h2>
            <p>
              GEODHA (“we,” “our,” or “us”) is a civic engagement platform that enables users to report and visualize local
              infrastructure challenges such as littering, water shortages, power outages, and road damage. We value your trust
              and are committed to protecting your privacy. This Privacy Policy explains what data we collect, how we use it,
              and your rights regarding that data.
            </p>

            <h2>2. Information We Collect</h2>

            <h3>a. Account Information</h3>
            <p>
              Email address (for login and account communication). Optional profile data (e.g., name or photo, if provided).
            </p>

            <h3>b. Reports Submitted by Users</h3>
            <p>Text descriptions, uploaded photos, and approximate location (latitude/longitude) associated with each civic report.</p>

            <h3>c. Device and Usage Data</h3>
            <p>
              Crash reports, diagnostics, and general analytics via Firebase and Expo services. Device type, operating system version,
              and anonymous usage metrics.
            </p>

            <h3>d. Location Data</h3>
            <p>
              Approximate location (based on device GPS or network data) to tag civic reports and display issues nearby. We do not
              continuously track your location — only when actively submitting a report.
            </p>

            <h2>3. How We Use Your Information</h2>
            <p>
              We use collected data to: operate and improve the GEODHA app and services; display community reports and generate public
              heatmaps; communicate updates, bug fixes, or feedback requests; detect and prevent misuse or fraudulent activity. We do
              not sell, rent, or trade personal data to third parties.
            </p>

            <h2>4. Data Sharing and Storage</h2>
            <p>
              Your data is securely stored and managed through Firebase (Google) infrastructure. Crash and performance data are
              processed by Firebase Crashlytics and Analytics. We may share aggregated, anonymized insights (never personal details)
              for research or public awareness purposes.
            </p>

            <h2>5. Data Security</h2>
            <p>
              All data is transmitted over encrypted HTTPS (TLS) connections. We maintain security practices to prevent unauthorized
              access or alteration of data.
            </p>

            <h2>6. Data Retention and Deletion</h2>
            <p>
              You can delete your account at any time through the app or by emailing us at <a href="mailto:contact@geodha.org">contact@geodha.org</a>.
              Upon deletion, all associated personal data will be removed from our servers within a reasonable period.
            </p>

            <h2>7. Children’s Privacy</h2>
            <p>
              GEODHA is intended for users aged 18 and above. We do not knowingly collect data from children under 13. If you believe a child has
              provided information, please contact us for prompt deletion.
            </p>

            <h2>8. Third-Party Services</h2>
            <p>
              GEODHA integrates with: Firebase Authentication, Firestore, Analytics, and Crashlytics (Google LLC); Expo services for app updates and diagnostics.
              Each third-party service operates under its own privacy terms.
            </p>

            <h2>9. Your Rights</h2>
            <p>
              You have the right to: access, correct, or delete your personal data; withdraw consent for data processing; request clarification on how your data is used.
              To exercise these rights, contact us at <a href="mailto:contact@geodha.org">contact@geodha.org</a>.
            </p>

            <h2>10. Updates to this Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this page with a revised effective date.
            </p>

            <h2>11. Contact</h2>
            <p>
              If you have any questions or concerns, please contact: GEODHA Team<br />
              <a href="mailto:contact@geodha.org">contact@geodha.org</a><br />
              <a href="https://geodha.org" target="_blank" rel="noopener noreferrer">https://geodha.org</a>
            </p>

            {/* Account Deletion Section appended as requested */}
            <h2 id="account-deletion">Account Deletion</h2>
            <p>
              If you would like to delete your GEODHA account and all associated data, please email
              <strong> <a href="mailto:contact@geodha.org">contact@geodha.org</a></strong> from the same email address used to sign in, and title the email as "Account Deletion Request".
              Your account and any submitted reports will be permanently deleted from our servers within 7 days of receiving your request.
            </p>
            <p>
              You may also contact us for assistance if you cannot access your registered email account.
            </p>

            <footer className="mt-12 text-center text-sm text-muted-foreground">
              <p>GEODHA — a volunteer-run community project.</p>
            </footer>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
