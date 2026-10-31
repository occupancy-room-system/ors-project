import SessionView from './view';

export const metadata = {
  title: 'My Active Workstation Session · SE Innovation Lab',
  description: 'View active session timer, remaining workstation time, and checkout controls',
};

export default function SessionPage() {
  return <SessionView />;
}
