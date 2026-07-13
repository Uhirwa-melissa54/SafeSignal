import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ChildService } from './child.service';
import { AddChildDto } from './dto/add-child.dto';

@Controller()
export class ChildController {
  constructor(private childService: ChildService) {}

  /** POST /add-child */
  @Post('add-child')
  @HttpCode(HttpStatus.CREATED)
  async addChild(@Body() dto: AddChildDto) {
    return this.childService.addChild(dto.parentId, dto.childName, dto.childPhone);
  }
}
