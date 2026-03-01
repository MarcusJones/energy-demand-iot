import { http, HttpResponse } from "msw";
import { getMockSiteRepository } from "@/repositories/mock/MockSiteRepository";
import { getMockDeviceRepository } from "@/repositories/mock/MockDeviceRepository";
import { getMockReadingRepository } from "@/repositories/mock/MockReadingRepository";
import { getMockForecastRepository } from "@/repositories/mock/MockForecastRepository";
import { getMockScheduleRepository } from "@/repositories/mock/MockScheduleRepository";
import { getMockTariffRepository } from "@/repositories/mock/MockTariffRepository";
import { getMockDREventRepository } from "@/repositories/mock/MockDREventRepository";
import type { ForecastType } from "@/schemas/forecast";
import type { ReadingResolution } from "@/schemas/reading";
import type { SiteStatus } from "@/schemas/site";
import type { CreateScheduleInput } from "@/repositories/interfaces/IScheduleRepository";

function getSearchParams(url: string) {
  return new URL(url).searchParams;
}

export const handlers = [
  // ── Sites ────────────────────────────────────────────
  http.get("/api/sites", async ({ request }: { request: Request }) => {
    const params = getSearchParams(request.url);
    const repo = getMockSiteRepository();
    const result = await repo.list({
      page: Number(params.get("page") ?? 1),
      pageSize: Number(params.get("pageSize") ?? 20),
      search: params.get("search") ?? undefined,
      status: (params.get("status") as SiteStatus) ?? undefined,
    });
    return HttpResponse.json(result);
  }),

  http.get("/api/sites/:id", async ({ params }: { params: Record<string, string> }) => {
    const repo = getMockSiteRepository();
    const site = await repo.getById(params.id);
    if (!site) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(site);
  }),

  http.get("/api/sites/:id/summary", async ({ params }: { params: Record<string, string> }) => {
    const repo = getMockSiteRepository();
    const summary = await repo.getSummary(params.id);
    if (!summary) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(summary);
  }),

  // ── Devices ──────────────────────────────────────────
  http.get("/api/devices", async ({ request }: { request: Request }) => {
    const params = getSearchParams(request.url);
    const repo = getMockDeviceRepository();
    const result = await repo.list({
      page: Number(params.get("page") ?? 1),
      pageSize: Number(params.get("pageSize") ?? 20),
      siteId: params.get("siteId") ?? undefined,
      search: params.get("search") ?? undefined,
    });
    return HttpResponse.json(result);
  }),

  http.get("/api/devices/:id", async ({ params }: { params: Record<string, string> }) => {
    const repo = getMockDeviceRepository();
    const device = await repo.getById(params.id);
    if (!device) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(device);
  }),

  http.get("/api/devices/counts/status", async ({ request }: { request: Request }) => {
    const params = getSearchParams(request.url);
    const repo = getMockDeviceRepository();
    const counts = await repo.getCountsByStatus(
      params.get("siteId") ?? undefined
    );
    return HttpResponse.json(counts);
  }),

  http.get("/api/devices/counts/type", async ({ request }: { request: Request }) => {
    const params = getSearchParams(request.url);
    const repo = getMockDeviceRepository();
    const counts = await repo.getCountsByType(
      params.get("siteId") ?? undefined
    );
    return HttpResponse.json(counts);
  }),

  // ── Readings ─────────────────────────────────────────
  http.get("/api/readings/:deviceId/latest", async ({ params }: { params: Record<string, string> }) => {
    const repo = getMockReadingRepository();
    const reading = await repo.getLatest(params.deviceId);
    if (!reading) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(reading);
  }),

  http.get("/api/readings/:deviceId/range", async ({ params, request }: { params: Record<string, string>; request: Request }) => {
    const sp = getSearchParams(request.url);
    const repo = getMockReadingRepository();
    const readings = await repo.getRange(
      params.deviceId,
      new Date(sp.get("from")!),
      new Date(sp.get("to")!),
      (sp.get("resolution") ?? "15min") as ReadingResolution
    );
    return HttpResponse.json(readings);
  }),

  http.get("/api/readings/aggregate/:siteId", async ({ params, request }: { params: Record<string, string>; request: Request }) => {
    const sp = getSearchParams(request.url);
    const repo = getMockReadingRepository();
    const aggregate = await repo.getAggregate(
      params.siteId,
      new Date(sp.get("from")!),
      new Date(sp.get("to")!)
    );
    return HttpResponse.json(aggregate);
  }),

  http.get("/api/readings/daily/:siteId", async ({ params, request }: { params: Record<string, string>; request: Request }) => {
    const sp = getSearchParams(request.url);
    const repo = getMockReadingRepository();
    const totals = await repo.getDailyTotals(
      params.siteId,
      Number(sp.get("days") ?? 30)
    );
    return HttpResponse.json(totals);
  }),

  // ── Forecasts ────────────────────────────────────────
  http.get("/api/forecasts/:siteId/latest", async ({ params, request }: { params: Record<string, string>; request: Request }) => {
    const sp = getSearchParams(request.url);
    const repo = getMockForecastRepository();
    const forecast = await repo.getLatest(
      params.siteId,
      (sp.get("type") ?? "solar") as ForecastType
    );
    if (!forecast) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(forecast);
  }),

  http.get("/api/forecasts/:siteId/horizon", async ({ params, request }: { params: Record<string, string>; request: Request }) => {
    const sp = getSearchParams(request.url);
    const repo = getMockForecastRepository();
    const forecast = await repo.getForHorizon(
      params.siteId,
      (sp.get("type") ?? "solar") as ForecastType,
      Number(sp.get("hours") ?? 48)
    );
    if (!forecast) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(forecast);
  }),

  // ── Schedules ────────────────────────────────────────
  http.get("/api/schedules", async ({ request }: { request: Request }) => {
    const params = getSearchParams(request.url);
    const repo = getMockScheduleRepository();
    const result = await repo.list({
      page: Number(params.get("page") ?? 1),
      pageSize: Number(params.get("pageSize") ?? 20),
      deviceId: params.get("deviceId") ?? undefined,
      status: params.get("status") ?? undefined,
    });
    return HttpResponse.json(result);
  }),

  http.post("/api/schedules", async ({ request }: { request: Request }) => {
    const body = (await request.json()) as CreateScheduleInput;
    const repo = getMockScheduleRepository();
    const schedule = await repo.create(body);
    return HttpResponse.json(schedule, { status: 201 });
  }),

  http.post("/api/schedules/:id/cancel", async ({ params }: { params: Record<string, string> }) => {
    const repo = getMockScheduleRepository();
    const schedule = await repo.cancel(params.id);
    if (!schedule) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(schedule);
  }),

  // ── Tariffs ──────────────────────────────────────────
  http.get("/api/tariffs/:siteId", async ({ params }: { params: Record<string, string> }) => {
    const repo = getMockTariffRepository();
    const tariffs = await repo.getForSite(params.siteId);
    return HttpResponse.json(tariffs);
  }),

  http.get("/api/tariffs/:siteId/active", async ({ params }: { params: Record<string, string> }) => {
    const repo = getMockTariffRepository();
    const tariff = await repo.getActive(params.siteId);
    if (!tariff) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(tariff);
  }),

  http.get("/api/tariffs/:siteId/price", async ({ params }: { params: Record<string, string> }) => {
    const repo = getMockTariffRepository();
    const price = await repo.getCurrentPrice(params.siteId);
    if (!price) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(price);
  }),

  // ── DR Events ────────────────────────────────────────
  http.get("/api/dr-events", async ({ request }: { request: Request }) => {
    const params = getSearchParams(request.url);
    const repo = getMockDREventRepository();
    const result = await repo.list({
      page: Number(params.get("page") ?? 1),
      pageSize: Number(params.get("pageSize") ?? 20),
      status: params.get("status") ?? undefined,
      type: params.get("type") ?? undefined,
    });
    return HttpResponse.json(result);
  }),

  http.get("/api/dr-events/active", async () => {
    const repo = getMockDREventRepository();
    const events = await repo.getActive();
    return HttpResponse.json(events);
  }),

  http.get("/api/dr-events/:id", async ({ params }: { params: Record<string, string> }) => {
    const repo = getMockDREventRepository();
    const event = await repo.getById(params.id);
    if (!event) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(event);
  }),
];
