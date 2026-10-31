import CheckInView from './view';

export const metadata = {
  title: 'QR Code Check-In · SE Innovation Lab',
  description: 'Scan physical desk QR code to check in and activate workstation reservation',
};

export default function CheckInPage() {
  return <CheckInView />;
}
