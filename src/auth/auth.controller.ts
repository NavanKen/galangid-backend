import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth-dto';
import { Auth } from './decorators/auth.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  login(@Body() dto: LoginDto) {
    return this.authService.LoginService(dto);
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.RegisterService(dto);
  }

  @Get('/me')
  @Auth()
  me(
    @CurrentUser('id')
    userId: string,
  ) {
    return this.authService.MeService(userId);
  }
}
