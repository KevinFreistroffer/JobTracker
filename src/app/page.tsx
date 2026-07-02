import { OpportunityDashboard } from "@/components/opportunity-dashboard";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <OpportunityDashboard />
      </div>
    </main>
  );
}
