import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentWebhookDto } from './dto/webhook-schema.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { role } from 'src/common/config/role.config';
import { PaymentProvider } from '@prisma/client';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @Auth(role.donor, role.campaigner)
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.create(createPaymentDto);
  }

  @Get(':id')
  @Auth(role.donor, role.campaigner)
  findOne(@Param('id') id: string) {
    return this.paymentService.findOne(id);
  }

  @Post('webhook/:provider')
  webhook(
    @Param('provider') provider: PaymentProvider,
    @Body() payload: PaymentWebhookDto,
  ) {
    return this.paymentService.webHook(provider, payload);
  }
}
