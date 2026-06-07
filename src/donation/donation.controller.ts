import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { DonationService } from './donation.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { role } from 'src/common/config/role.config';
import { QueryDonationDto } from './dto/query-donation.dto';
import { AdminQueryDonationDto } from './dto/query-donation.dto';

@Controller('donation')
export class DonationController {
  constructor(private readonly donationService: DonationService) {}

  @Post()
  @Auth(role.donor, role.campaigner)
  create(
    @Body() createDonationDto: CreateDonationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.donationService.create(createDonationDto, userId);
  }

  @Get('admin')
  @Auth(role.admin)
  adminDonationList(@Query() query: AdminQueryDonationDto) {
    return this.donationService.adminDonationList(query);
  }

  @Get()
  @Auth(role.donor, role.campaigner)
  getAllMyDonation(
    @CurrentUser('id') userId: string,
    @Query() query: QueryDonationDto,
  ) {
    return this.donationService.getAllMyDonation(userId, query);
  }

  @Get(':id')
  @Auth(role.donor, role.campaigner)
  getMyDonation(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.donationService.getMyDonation(id, userId);
  }
}
