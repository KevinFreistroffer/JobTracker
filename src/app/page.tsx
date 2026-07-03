import { AppShell } from "@/components/app-shell";
import { OpportunityDashboard } from "@/components/opportunity-dashboard";

export default function HomePage() {
  return (
    <AppShell>
      <OpportunityDashboard />
    </AppShell>
  );
}
