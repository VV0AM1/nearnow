import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { LostFoundService } from './lost-found.service';
import { LostFoundController } from './lost-found.controller';

@Module({
  imports: [NotificationsModule],
  providers: [LostFoundService],
  controllers: [LostFoundController],
  exports: [LostFoundService],
})
export class LostFoundModule {}
