import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { QueryCampaignDto } from './dto/query-campaign.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { role } from 'src/common/config/role.config';

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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.campaignService.findOne(id);
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
  remove(@Param('id') id: string) {
    return this.campaignService.remove(id);
  }
}
