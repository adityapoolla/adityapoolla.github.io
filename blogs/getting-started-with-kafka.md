# Getting Started with Apache Kafka: A Practical Guide

Apache Kafka is one of those technologies that changes how you think about data flow in distributed systems. Having worked with it extensively at PKGlobal (processing millions of IoT events from trains) and Walmart, here's my practical take.

## What is Kafka?

Kafka is a **distributed event streaming platform** — think of it as a high-throughput, fault-tolerant message bus. At its core:

- **Topics** are named streams of records
- **Producers** publish records to topics
- **Consumers** subscribe and process records
- **Partitions** enable parallelism and scalability

## Setting Up a Simple Producer in Java

```java
Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");
props.put("key.serializer",   "org.apache.kafka.common.serialization.StringSerializer");
props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");

KafkaProducer<String, String> producer = new KafkaProducer<>(props);
producer.send(new ProducerRecord<>("device-events", "device-001", "{\"status\":\"online\"}"));
producer.close();
```

## Consumer Groups

Consumer groups are Kafka's secret weapon for scalable processing. Each partition is consumed by exactly one consumer in a group — giving you natural load balancing.

```java
props.put("group.id", "isdp-consumer-group");
props.put("auto.offset.reset", "earliest");

KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);
consumer.subscribe(List.of("device-events"));

while (true) {
  ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
  records.forEach(r -> processEvent(r.value()));
}
```

## Lessons from Production

> At Walmart, we process heartbeat events from thousands of POS devices using this exact pattern — with consumer groups scaled horizontally across pods in Kubernetes.

Key takeaways from running Kafka in production:

- **Tune your consumer lag** — monitor it via Prometheus metrics
- **Idempotent producers** prevent duplicate events during retries
- **Compacted topics** are great for state snapshots (device last-known-state)
- **Schema Registry** saves you from breaking changes in event schemas

## Kafka + GCP Pipeline

At Walmart's ISDP platform, we pipe Kafka events into a GCP data lake for analysis via BigQuery. The pattern looks like:

```
Device → Kafka Topic → Consumer → GCP Pub/Sub → BigQuery
```

This gives us near-real-time dashboards in Looker for store operations teams.

---

Kafka is genuinely one of the most transformative tools in the modern backend stack. Once you understand partitions and consumer groups, the possibilities are endless.
