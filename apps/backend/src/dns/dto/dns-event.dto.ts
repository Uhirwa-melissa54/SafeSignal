import { IsString, IsNotEmpty } from 'class-validator';

/** DTO for POST /dns/event – sent by the DNS service when a domain is blocked */
export class DnsEventDto {
  @IsString()
  @IsNotEmpty()
  childId: string;

  @IsString()
  @IsNotEmpty()
  domain: string;

  @IsString()
  @IsNotEmpty()
  category: string;
}
