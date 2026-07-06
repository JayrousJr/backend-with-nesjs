import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PubSubService } from './pubsub.service';
import { EventsGateway } from './events.gateway';
import { EventsResolver } from './events.resolver';

@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [PubSubService, EventsGateway, EventsResolver],
  exports: [PubSubService, EventsGateway],
})
export class EventsModule {}
