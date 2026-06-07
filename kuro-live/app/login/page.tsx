import type { Metadata } from 'next';
import { AuthPanel } from '@/components/auth/AuthPanel';

export const metadata: Metadata = {
  title: 'Login',
};

export default function LoginPage() {
  return <AuthPanel mode="login" />;
}
