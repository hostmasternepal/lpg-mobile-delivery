import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get('health')
  health() {
    // Liveness/readiness probe for Docker HEALTHCHECK and the reverse proxy
    // — docs/ARCHITECTURE.md §12. Deliberately excluded from the
    // /api/v1 prefix (see main.ts) so infra tooling has a stable path.
    return { status: 'ok' };
  }
}
