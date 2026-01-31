import { Module, Global } from "@nestjs/common";
import { EventBusPort } from "../../application/ports/event-bus.port.js";
import { InMemoryEventBus } from "../../infra/events/in-memory-event-bus.js";

@Global()
@Module({
  providers: [
    {
      provide: EventBusPort,
      useClass: InMemoryEventBus,
    },
  ],
  exports: [EventBusPort],
})
export class EventsModule {}
