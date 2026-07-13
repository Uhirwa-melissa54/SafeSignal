import { IsString, IsNotEmpty, Matches } from 'class-validator';

/** DTO for POST /register-parent */
export class RegisterParentDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'phoneNumber must be a valid phone number' })
  phoneNumber: string;
}
