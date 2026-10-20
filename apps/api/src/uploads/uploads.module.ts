import { Global, Module } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { LocalDiskStorage, STORAGE_ADAPTER } from './storage';
import { appConfig } from '../common/env';

@Global()
@Module({
  providers: [
    {
      provide: STORAGE_ADAPTER,
      useFactory: () => new LocalDiskStorage(appConfig().uploadDir),
    },
    UploadsService,
  ],
  exports: [UploadsService],
})
export class UploadsModule {}
