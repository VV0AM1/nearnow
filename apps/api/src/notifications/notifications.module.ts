import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { AppGateway } from '../app.gateway';

@Module({
  providers: [NotificationsService, AppGateway],
  controllers: [NotificationsController],
  exports: [NotificationsService]
})
export class NotificationsModule { }
