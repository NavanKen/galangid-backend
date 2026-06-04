import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Patch,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryGlobal } from '../common/dto/query.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { role } from '../common/config/role.config';

@Controller('user')
@Auth(role.admin)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll(@Query() query: QueryGlobal) {
    return this.userService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  @Patch(':id/ban')
  banUser(@Param('id') id: string) {
    return this.userService.banUser(id);
  }

  @Patch(':id/unban')
  unBanUser(@Param('id') id: string) {
    return this.userService.unBanUser(id);
  }
}
