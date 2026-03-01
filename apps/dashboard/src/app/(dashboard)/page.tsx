import { OverviewFilterBar } from "@/components/dashboard/overview-filter-bar";
import { OverviewKPIs } from "@/components/dashboard/overview-kpis";
import { EnergyFlowSankey } from "@/components/dashboard/energy-flow-sankey";
import { PowerCurve } from "@/components/dashboard/power-curve";

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="mt-1 text-muted-foreground">
          Portfolio-wide energy performance at a glance.
        </p>
      </div>

      <OverviewFilterBar />

      <OverviewKPIs />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EnergyFlowSankey />
        <PowerCurve />
      </div>
    </div>
  );
}
