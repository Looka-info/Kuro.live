import type { Metadata } from 'next';
import { AuthPanel } from '@/components/auth/AuthPanel';

export const metadata: Metadata = {
  title: 'Sign up',
};

export default function SignupPage() {
  return <AuthPanel mode="signup" />;
}
