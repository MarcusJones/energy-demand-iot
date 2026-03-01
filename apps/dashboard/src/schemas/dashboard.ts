import { z } from "zod";

/** A single KPI card's data */
export const KPIDataSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.number(),
  unit: z.string(),
  /** Percentage change vs. previous period (e.g., 0.042 = +4.2%) */
  delta: z.number(),
  /** Whether higher values are unfavorable (e.g., consumption going up is bad) */
  invertDelta: z.boolean(),
  /** 24 data points for the sparkline trend */
  sparklineData: z.array(z.number()),
  /** CSS variable name for domain color (e.g., "solar", "grid-import") */
  colorKey: z.string(),
});

export type KPIData = z.infer<typeof KPIDataSchema>;

/** Sankey diagram node */
export const EnergyFlowNodeSchema = z.object({
  name: z.string(),
  /** CSS variable key for color */
  colorKey: z.string(),
});

export type EnergyFlowNode = z.infer<typeof EnergyFlowNodeSchema>;

/** Sankey diagram link */
export const EnergyFlowLinkSchema = z.object({
  source: z.string(),
  target: z.string(),
  value: z.number(),
});

export type EnergyFlowLink = z.infer<typeof EnergyFlowLinkSchema>;

/** Complete energy flow data for the Sankey diagram */
export const EnergyFlowDataSchema = z.object({
  nodes: z.array(EnergyFlowNodeSchema),
  links: z.array(EnergyFlowLinkSchema),
});

export type EnergyFlowData = z.infer<typeof EnergyFlowDataSchema>;

/** Multi-series time-series data for the power curve */
export const PowerCurveDataSchema = z.object({
  /** Unix timestamps (seconds) for each data point */
  timestamps: z.array(z.number()),
  /** Series data keyed by series name */
  series: z.record(z.string(), z.array(z.number())),
});

export type PowerCurveData = z.infer<typeof PowerCurveDataSchema>;
