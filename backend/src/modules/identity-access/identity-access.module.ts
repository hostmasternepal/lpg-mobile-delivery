import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { IdentityAccessController } from './identity-access.controller';
import { IdentityAccessService } from './identity-access.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [IdentityAccessController],
  providers: [IdentityAccessService, JwtStrategy],
  exports: [IdentityAccessService],
})
export class IdentityAccessModule {}
