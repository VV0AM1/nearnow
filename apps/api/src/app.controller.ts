import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { appConfig } from './common/env';
import { OFFICIAL_DATA_PROVIDERS } from './official-data/official-data';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /** Liveness plus which optional integrations are actually configured on this server. */
  @Get('health')
  health() {
    const c = appConfig();
    return {
      status: 'ok',
      features: {
        pushNotifications: c.pushProvider !== null,
        emailDelivery: c.emailConfigured,
        reverseGeocoding: c.geocoderProvider !== null,
        officialDataSources: OFFICIAL_DATA_PROVIDERS.map((p) => p.name),
        trustedJourney: false,
        routing: false,
      },
    };
  }
}
