import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Put,
} from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { QueryCampaignDto } from './dto/query-campaign.dto';
import { QueryCampaignReviewDto } from './dto/query-campaign.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { role } from 'src/common/config/role.config';
import { RejectedCampaignDto } from './dto/admin-review-campaign.dto';

@Controller('campaign')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  @Auth(role.campaigner)
  create(
    @Body() createCampaignDto: CreateCampaignDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.campaignService.create(createCampaignDto, userId);
  }

  @Get()
  findAll(@Query() query: QueryCampaignDto) {
    return this.campaignService.findAll(query);
  }

  @Get('admin')
  @Auth(role.admin)
  findAllAdmin(@Query() query: QueryCampaignDto) {
    return this.campaignService.findAllAdmin(query);
  }

  @Get('admin')
  @Auth(role.admin)
  findAllCampaignReviewHistory(@Query() query: QueryCampaignReviewDto) {
    return this.campaignService.findAllCampaignReviewHistory(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.campaignService.findOne(id);
  }

  @Get(':id')
  @Auth(role.campaigner)
  myCampaign(
    @Query() query: QueryCampaignDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.campaignService.myCampaign(query, userId);
  }

  @Patch(':id')
  @Auth(role.campaigner)
  update(
    @Param('id') id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.campaignService.update(id, updateCampaignDto, userId);
  }

  @Delete(':id')
  @Auth(role.campaigner)
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.campaignService.remove(id, userId);
  }

  @Patch(':id/submit')
  @Auth(role.campaigner)
  submit(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.campaignService.submit(id, userId);
  }

  @Get('pending')
  @Auth(role.admin)
  pendingReview(@Query() query: QueryCampaignDto) {
    return this.campaignService.pendingReviewList(query);
  }

  @Put(':id/reject')
  @Auth(role.admin)
  reject(
    @Param('id') id: string,
    @Body() dto: RejectedCampaignDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.campaignService.reject(id, dto, adminId);
  }

  @Put(':id/suspend')
  @Auth(role.admin)
  suspend(
    @Param('id') id: string,
    @Body() dto: RejectedCampaignDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.campaignService.suspend(id, dto, adminId);
  }

  @Put(':id/approve')
  @Auth(role.admin)
  aprrove(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.campaignService.aprrove(id, adminId);
  }
}
