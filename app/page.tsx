import { redirect } from 'next/navigation';

export default function Page() {
  // Server-side redirect to landing page so the landing page is the app root
  redirect('/landing');
}
