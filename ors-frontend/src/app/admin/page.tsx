import AdminView from './view';

export const metadata = {
  title: 'Lab Administration Console · SE Innovation Lab',
  description: 'Workstation fleet management, real-time telemetry, session overrides, and printable QR sheets',
};

export default function AdminPage() {
  return <AdminView />;
}
