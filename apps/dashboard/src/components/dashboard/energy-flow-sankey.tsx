"use client";

import { useMemo } from "react";
import { useEnergyFlow } from "@/hooks/use-dashboard";
import { EChartsWrapper } from "@/components/charts/echarts-wrapper";
import { getDomainColor } from "@/components/charts/uplot-wrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import type { EChartsOption } from "echarts";

/** Map colorKey to resolved CSS color */
function resolveNodeColors(
  nodes: { name: string; colorKey: string }[]
): Record<string, string> {
  const colors: Record<string, string> = {};
  for (const node of nodes) {
    colors[node.name] = getDomainColor(node.colorKey) || "#888";
  }
  return colors;
}

export function EnergyFlowSankey() {
  const { data: flowData, isLoading, error } = useEnergyFlow();

  const option = useMemo((): EChartsOption | null => {
    if (!flowData) return null;

    const nodeColors = resolveNodeColors(flowData.nodes);

    return {
      tooltip: {
        trigger: "item",
        triggerOn: "mousemove",
      },
      series: [
        {
          type: "sankey",
          emphasis: { focus: "adjacency" },
          nodeAlign: "justify",
          orient: "horizontal",
          nodeWidth: 20,
          nodeGap: 14,
          layoutIterations: 32,
          label: {
            position: "right",
            fontSize: 12,
          },
          lineStyle: {
            color: "gradient",
            curveness: 0.5,
            opacity: 0.4,
          },
          data: flowData.nodes.map((node) => ({
            name: node.name,
            itemStyle: {
              color: nodeColors[node.name],
            },
          })),
          links: flowData.links.map((link) => ({
            source: link.source,
            target: link.target,
            value: link.value,
          })),
        },
      ],
    };
  }, [flowData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Energy Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Energy Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>Failed to load energy flow: {error.message}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!option) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Energy Flow</CardTitle>
      </CardHeader>
      <CardContent>
        <EChartsWrapper
          option={option}
          height={400}
          className="w-full"
        />
      </CardContent>
    </Card>
  );
}
