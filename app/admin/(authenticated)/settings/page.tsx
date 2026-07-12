import SettingsClient from "./SettingsClient";

export default function AdminSettingsPage() {
  return (
    <div className="animate-fade-up">
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em" }}>
        Platform Settings
      </h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>
        Configure global platform settings, access controls, and administrative permissions.
      </p>

      <SettingsClient />
    </div>
  );
}
