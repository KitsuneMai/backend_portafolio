import { IsString, IsNumber, IsOptional, Min, Max, IsEnum } from 'class-validator';
import { VehicleType, PartType } from '../enums/product.enums';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  basePrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  ivaPercentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;


  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @IsEnum(PartType)
  partType: PartType;

}
