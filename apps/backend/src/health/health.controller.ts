import { Controller, Get } from '@nestjs/common';

/**
 * HealthController exposes GET /health for Docker health checks
 * and load balancer probes.
 */
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'SafeSignal Backend',
      timestamp: new Date().toISOString(),
    };
  }
}
