import { redirect } from 'next/navigation';

export default function WikiLandingPage() {
  redirect('/wiki/fr/README');
}
