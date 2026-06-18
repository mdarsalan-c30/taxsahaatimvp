import type {
  AnalyticsEventName,
  AnalyticsEventProps,
  QueuedAnalyticsEvent,
} from "./events";
import {
  noopAnalyticsProvider,
  type AnalyticsProvider,
  QueuedAnalyticsProvider,
} from "./provider";
import { getBrowserSessionId } from "@/lib/store/sessionInit";

/** Best-effort server beacon so the admin dashboard can compute native KPIs. */
function beaconToAdmin(name: string, props?: AnalyticsEventProps): void {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify({
      sessionId: getBrowserSessionId(),
      eventName: name,
      payload: props,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
    }
  } catch {
    // Never block the funnel on telemetry.
  }
}

export type { AnalyticsEventName, AnalyticsEventProps, QueuedAnalyticsEvent };
export type { AnalyticsProvider };
export { noopAnalyticsProvider, QueuedAnalyticsProvider };

const eventQueue: QueuedAnalyticsEvent[] = [];
let provider: AnalyticsProvider = new QueuedAnalyticsProvider(noopAnalyticsProvider);

export function setAnalyticsProvider(next: AnalyticsProvider): void {
  provider = new QueuedAnalyticsProvider(next);
}

export function getQueuedEvents(): readonly QueuedAnalyticsEvent[] {
  return eventQueue;
}

export function clearQueuedEvents(): void {
  eventQueue.length = 0;
}

/** Lightweight funnel tracker — console in dev, queued for future provider wiring. */
export function trackEvent(
  name: AnalyticsEventName,
  props?: AnalyticsEventProps
): void {
  const event: QueuedAnalyticsEvent = {
    name,
    props,
    timestamp: Date.now(),
  };

  eventQueue.push(event);

  if (process.env.NODE_ENV === "development") {
    console.log("[analytics]", name, props ?? {});
  }

  beaconToAdmin(name, props);
  provider.track(name, props);
}

export async function flushAnalytics(): Promise<void> {
  await provider.flush?.();
}
