import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentWebhookDto } from './dto/webhook-schema.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { role } from 'src/common/config/role.config';

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

  @Post('webhook')
  @Auth(role.donor, role.donor)
  webhook(@Body() payload: PaymentWebhookDto) {
    return this.paymentService.webHook(payload);
  }
}
