import { Module } from '@nestjs/common';
import { SqsConsumerService } from './sqs-consumer.service';

@Module({
  providers: [SqsConsumerService],
})
export class SagaModule {}
