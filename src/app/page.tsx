import { DashboardPage } from '@/components/dashboard/dashboard-page';
// import { SessionDebug } from '@/components/debug/session-debug';

export default function Home() {
  return (
    <div className="flex flex-col space-y-6">
      {/* <SessionDebug /> */}
      <DashboardPage />
    </div>
  );
}
