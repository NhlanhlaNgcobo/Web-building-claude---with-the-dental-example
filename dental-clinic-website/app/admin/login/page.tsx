import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/components/admin/LoginForm';
import { Monogram } from '@/components/brand/Logo';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <Monogram className="size-9 text-blue" />
          <h1 className="mt-5 text-[1.375rem] font-semibold text-white">
            Practice diary
          </h1>
          <p className="mt-1.5 text-sm text-white/55">
            Staff access only.
          </p>
        </div>

        <div className="mt-8 rounded-card glass-dark p-6">
          <Suspense
            fallback={<div className="h-40 animate-pulse rounded-panel bg-white/10" />}
          >
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-white/40">
          This area holds patient information. Do not leave it open on a shared
          screen, and sign out when you are finished.
        </p>
      </div>
    </div>
  );
}
