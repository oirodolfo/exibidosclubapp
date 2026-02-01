import {
  EventBusPort,
  type HumanproofDomainEvent,
} from "../../application/ports/event-bus.port";

/**
 * In-memory event bus with structured audit logging.
 * Swap for Kafka adapter in production.
 */
export class InMemoryEventBus extends EventBusPort {
  async emit(event: HumanproofDomainEvent): Promise<void> {
    const audit = {
      ts: new Date().toISOString(),
      event: event.type,
      payload: event,
    };
    // Structured log (JSON) for audit; Kafka adapter would also produce to topic
    console.log(JSON.stringify(audit));
  }
}
