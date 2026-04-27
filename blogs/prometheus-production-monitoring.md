# Effectively Monitoring Production Systems with Prometheus Metrics

When a production system goes down at 2 AM, you don't want to be staring at a wall of green dashboards wondering what changed. Good monitoring is the difference between a five-minute fix and a five-hour war room. Over the past few years — instrumenting POS device platforms at Walmart, document management services at OpenText, and IoT pipelines at PKGlobal — I've come to believe that **most production outages are not surprises; they're signals you missed.**

This post is a practical playbook for using Prometheus metrics to actually catch those signals before your users do.

## Why Prometheus?

Prometheus has become the de-facto standard for cloud-native monitoring for a reason. It's a pull-based time-series database with a powerful query language (PromQL), a flexible label model, and a healthy ecosystem of exporters and integrations. Unlike push-based systems, Prometheus actively scrapes your services on a schedule, which makes service discovery, health detection, and reproducible queries far easier.

But the tool is only half the story. The other half is **what you choose to measure** and **how you alert on it.**

## The Four Golden Signals

Google's SRE book popularized the four signals every user-facing system should expose. Memorize these — they cover roughly 90% of what you need to know about a service's health:

1. **Latency** — how long requests take. Track *successful* and *failed* latencies separately, because a fast 500 is still a 500.
2. **Traffic** — how much demand is being placed on the system (requests per second, messages consumed per second, etc.).
3. **Errors** — the rate of failed requests. Both explicit (HTTP 5xx) and implicit (a 200 with the wrong payload).
4. **Saturation** — how "full" your service is. CPU, memory, queue depth, thread-pool utilization.

If your dashboards don't show all four for every critical service, start there before doing anything else.

## Picking the Right Metric Type

Prometheus exposes four metric types, and choosing correctly matters more than people think.

**Counter** — a value that only goes up (or resets to zero on restart). Use it for totals: `http_requests_total`, `kafka_messages_consumed_total`, `errors_total`. You almost never look at a counter directly; you wrap it in `rate()` to get a per-second rate.

**Gauge** — a value that can go up or down. Use it for things you sample: `queue_depth`, `active_connections`, `memory_bytes_used`. Don't use a gauge for something cumulative — you'll lose information across restarts.

**Histogram** — buckets observations into pre-configured ranges so you can compute quantiles. This is what you want for latency: `http_request_duration_seconds`. Histograms are aggregatable across instances, which is what makes them so useful.

**Summary** — similar to histogram but computes quantiles client-side. Cheaper to query but **not aggregatable** across pods. Avoid summaries unless you only ever look at a single instance.

> **Rule of thumb:** counters for events, gauges for current state, histograms for distributions. Reach for summary only when you have a specific reason.

## Instrumenting a Spring Boot Service with Micrometer

In the Java ecosystem, Micrometer is the standard way to expose Prometheus metrics. Spring Boot wires it in automatically via `spring-boot-starter-actuator` and `micrometer-registry-prometheus`.

```java
@RestController
public class CheckoutController {

    private final Counter checkoutCounter;
    private final Timer checkoutTimer;

    public CheckoutController(MeterRegistry registry) {
        this.checkoutCounter = Counter.builder("checkout_attempts_total")
                .description("Total checkout attempts")
                .tag("service", "pos")
                .register(registry);

        this.checkoutTimer = Timer.builder("checkout_duration_seconds")
                .description("Checkout latency")
                .publishPercentileHistogram()
                .register(registry);
    }

    @PostMapping("/checkout")
    public CheckoutResponse checkout(@RequestBody CheckoutRequest req) {
        checkoutCounter.increment();
        return checkoutTimer.record(() -> processCheckout(req));
    }
}
```

A few things to note. We're tagging the counter with `service="pos"` so we can slice by service in PromQL. We're calling `publishPercentileHistogram()` on the timer — this exposes proper histogram buckets that aggregate cleanly across pods. And we're keeping the metric names in `snake_case_total` / `_seconds` form, which is the Prometheus naming convention.

Once your app is running, hit `/actuator/prometheus` and you'll see something like:

```
# HELP checkout_duration_seconds Checkout latency
# TYPE checkout_duration_seconds histogram
checkout_duration_seconds_bucket{le="0.005"} 142
checkout_duration_seconds_bucket{le="0.01"}  389
checkout_duration_seconds_bucket{le="0.025"} 1247
checkout_duration_seconds_bucket{le="+Inf"}  1893
checkout_duration_seconds_count 1893
checkout_duration_seconds_sum 47.21
```

That's the raw data Prometheus will scrape every 15 or 30 seconds.

## PromQL Queries That Actually Earn Their Keep

Once metrics are flowing, PromQL is where you turn raw data into answers. Here are the queries I reach for again and again.

**Request rate per second, by status code:**

```promql
sum by (status) (rate(http_requests_total[5m]))
```

**Error rate as a percentage of total requests:**

```promql
sum(rate(http_requests_total{status=~"5.."}[5m]))
  /
sum(rate(http_requests_total[5m]))
```

**p95 latency, aggregated across all pods:**

```promql
histogram_quantile(0.95,
  sum by (le) (rate(http_request_duration_seconds_bucket[5m]))
)
```

The `histogram_quantile` over `sum by (le) (rate(..._bucket[...]))` pattern is one you'll use constantly. It's what makes histograms aggregatable — you sum the bucket counts across instances first, then compute the quantile.

**Kafka consumer lag, the metric that has saved me more than once:**

```promql
max by (topic, consumer_group) (kafka_consumer_lag)
```

If this number is climbing steadily, your consumer can't keep up and you're heading for a problem. Alert on it before it becomes a customer-visible incident.

## SLIs, SLOs, and Why Alerting on Symptoms Beats Alerting on Causes

A common mistake is to alert on every CPU spike, every garbage-collection pause, every momentary error. You'll page yourself into burnout and start ignoring everything.

Instead, define **Service Level Indicators (SLIs)** — a small number of metrics that actually represent whether users are getting a good experience. Then set **Service Level Objectives (SLOs)** — the target you're trying to hit. For example:

- **Availability SLO:** 99.9% of requests return a 2xx or 3xx over a rolling 30 days.
- **Latency SLO:** 95% of requests complete in under 300ms.

Alert when you're **burning your error budget too fast**, not when a single bad data point shows up. A burn-rate alert looks roughly like:

```promql
(
  sum(rate(http_requests_total{status=~"5.."}[1h]))
    /
  sum(rate(http_requests_total[1h]))
) > (14.4 * 0.001)
```

That fires when the error rate over the last hour is high enough to burn 2% of a 30-day error budget — meaning you'd exhaust the budget in about 2 days at that rate. Burn-rate alerts catch real problems while ignoring noise.

## The Cardinality Trap

This is the single most common Prometheus mistake I see, so it gets its own section. **Every unique combination of label values creates a new time series.** A metric like:

```
http_requests_total{user_id="abc-123", path="/checkout"}
```

is a disaster. If you have a million users, you now have a million time series for one metric. Your Prometheus server will run out of memory, scrapes will time out, and queries will crawl.

The rule: **labels should have low, bounded cardinality.** Status codes, HTTP methods, route templates, service names — yes. User IDs, request IDs, full URLs with path parameters — no. If you need to look something up by user ID, that's a job for logs or traces, not metrics.

## Dashboards and Runbooks

Metrics without context are just shapes on a screen. Two things make dashboards genuinely useful in an incident:

First, every dashboard should answer **a specific question**: "Is the checkout service healthy?" not "Here are 47 random graphs about checkout." Group by user-facing concern, not by underlying tech.

Second, every alert should link to a **runbook** — a short doc explaining what the alert means, the most likely causes, and the first three things to check. The on-caller at 3 AM is not in a state to derive these from first principles.

## Putting It Together

A production-ready monitoring setup, in order of priority:

The first thing to add is the four golden signals as histograms and counters on every external endpoint. The second is consumer lag (or its equivalent for whatever async system you run) on every queue or topic. The third is saturation gauges — JVM heap, thread pools, DB connection pool — for each service. The fourth is a small set of burn-rate alerts tied to clearly written SLOs. The fifth is dashboards organized around user-facing journeys, each with a linked runbook.

Everything beyond that is optimization. These five layers will catch most real production problems before your users find them.

---

Monitoring is a craft, and like all crafts, the value compounds. Every alert you tune, every metric you instrument, every runbook you write makes the next incident shorter. Start with the four golden signals, keep your cardinality bounded, alert on symptoms not causes, and the rest will follow.
