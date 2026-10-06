import type { Metadata } from 'next';
import { Logo } from '@/components/brand/Logo';
import { StaffLoginForm } from '@/components/admin/StaffLoginForm';

export const metadata: Metadata = {
  title: 'Staff sign in',
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: PageProps<'/admin/login'>) {
  const params = await searchParams;
  const next = typeof params.next === 'string' ? params.next : '/admin';

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <Logo />
        </div>

        <div className="mt-8 rounded-card border border-line bg-white p-6">
          <h1 className="text-[1.25rem] font-bold text-ink">Staff sign in</h1>
          <p className="mt-1.5 text-[0.875rem] leading-relaxed text-grey-strong">
            This area is for the shop. Customers can track an order without
            signing in.
          </p>

          <div className="mt-6">
            {/* `next` is validated inside the form rather than used as given.
                An open redirect from a sign-in page is a phishing primitive. */}
            <StaffLoginForm next={next} />
          </div>
        </div>

        <p className="mt-6 text-center text-[0.75rem] text-grey">
          Sessions last eight hours and then need signing in again.
        </p>
      </div>
    </div>
  );
}
