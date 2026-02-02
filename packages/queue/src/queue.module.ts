import { DynamicModule, Module } from "@nestjs/common";
import {
  QueueProducer,
  QueueProducerOptions,
  QUEUE_PRODUCER_OPTIONS,
} from "./queue-producer";
import {
  QueueConsumer,
  QueueConsumerOptions,
  QUEUE_CONSUMER_OPTIONS,
} from "./queue-consumer";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

@Module({})
export class QueueModule {
  static forRoot(options?: {
    redisUrl?: string;
  }): DynamicModule {
    const redisUrl = options?.redisUrl ?? REDIS_URL;
    const producerOptions: QueueProducerOptions = { redisUrl };
    const consumerOptions: QueueConsumerOptions = { redisUrl };
    return {
      module: QueueModule,
      global: true,
      providers: [
        {
          provide: QUEUE_PRODUCER_OPTIONS,
          useValue: producerOptions,
        },
        {
          provide: QUEUE_CONSUMER_OPTIONS,
          useValue: consumerOptions,
        },
        QueueProducer,
        QueueConsumer,
      ],
      exports: [QueueProducer, QueueConsumer],
    };
  }
}
