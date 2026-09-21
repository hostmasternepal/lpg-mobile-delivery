import { Body, Controller, Get, Post } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { IdentityAccessService } from './identity-access.service';

@Controller()
export class UsersController {
  constructor(private readonly identityAccess: IdentityAccessService) {}

  @Get('users')
  @Permissions('user:manage')
  listUsers() {
    return this.identityAccess.listUsers();
  }

  @Post('users')
  @Permissions('user:manage')
  createUser(@Body() dto: CreateUserDto) {
    return this.identityAccess.createUser(dto);
  }

  @Get('roles')
  @Permissions('user:manage')
  listRoles() {
    return this.identityAccess.listRoles();
  }
}
