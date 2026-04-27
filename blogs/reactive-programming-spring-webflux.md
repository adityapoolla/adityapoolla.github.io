# Reactive Programming with Spring WebFlux

When I joined OpenText to work on the Core Content document management platform, one of the first architectural decisions was: **Spring MVC or Spring WebFlux?** We chose WebFlux, and here's why — and what I learned.

## The Problem with Blocking I/O

Traditional Spring MVC is thread-per-request. Each incoming HTTP call blocks a thread while waiting for DB queries, S3 uploads, or downstream API calls. Under high concurrency, you run out of threads fast.

WebFlux uses a **non-blocking, event-loop model** (powered by Project Reactor) — a small number of threads can handle thousands of concurrent connections.

## Core Concepts

### Mono and Flux

```java
// Mono: 0 or 1 item
Mono<Document> getDocument(String id) {
    return documentRepository.findById(id);
}

// Flux: 0 to N items
Flux<Document> listDocuments(String folderId) {
    return documentRepository.findByFolderId(folderId);
}
```

### Chaining Operators

The real power is in composition:

```java
public Mono<ResponseEntity<DocumentDto>> uploadDocument(
        String tenantId, FilePart file) {

    return s3Service.upload(tenantId, file)          // upload to S3
        .flatMap(s3Key -> documentRepository          // persist metadata
            .save(new Document(tenantId, s3Key)))
        .map(DocumentDto::from)                       // map to DTO
        .map(ResponseEntity::ok)
        .onErrorReturn(ResponseEntity.internalServerError().build());
}
```

## Multi-Tenant Architecture

At OpenText, we built a **multi-tenant SaaS** where each tenant's data is fully isolated. WebFlux made this elegant using context propagation:

```java
.contextWrite(ctx -> ctx.put("tenantId", tenantId))
```

Downstream operators read the tenant from context — no thread-local headaches.

## Performance Results

Switching from a blocking prototype to WebFlux gave us:

- **3x throughput** on document upload endpoints
- **60% reduction** in memory usage under peak load
- Latency p99 dropped from ~800ms to ~120ms

## When NOT to Use WebFlux

WebFlux isn't always the answer:

- If your team is new to reactive concepts, the learning curve is steep
- JDBC is blocking — use R2DBC for reactive DB access
- Debugging stack traces in reactive pipelines is painful

---

Reactive programming is a paradigm shift, not just an API change. Once it clicks, though, it's genuinely elegant. Worth the investment for high-throughput services.
