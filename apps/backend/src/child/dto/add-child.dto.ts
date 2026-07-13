import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class AddChildDto {
  @IsString()
  @IsNotEmpty()
  parentId: string;

  @IsString()
  @IsNotEmpty()
  childName: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'childPhone must be a valid phone number' })
  childPhone: string;
}
