import { Module, Global } from "@nestjs/common";
import { EventBusPort } from "../../application/ports/event-bus.port";
import { InMemoryEventBus } from "../../infra/events/in-memory-event-bus";

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
