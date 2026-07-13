import { Module } from '@nestjs/common';
import { ChildController } from './child.controller';

@Module({
  controllers: [ChildController]
})
export class ChildModule {}
