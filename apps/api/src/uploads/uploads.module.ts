import { Global, Module } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { createStorage, STORAGE_ADAPTER } from './storage';
import { appConfig } from '../common/env';

@Global()
@Module({
  providers: [
    {
      provide: STORAGE_ADAPTER,
      useFactory: () =>
        createStorage(appConfig().storage, appConfig().uploadDir),
    },
    UploadsService,
  ],
  exports: [UploadsService],
})
export class UploadsModule {}
