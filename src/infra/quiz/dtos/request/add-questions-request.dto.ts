
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { QuizCategory } from "../../enums/quiz-category.enum";
import { Type } from "class-transformer";

export class Alternative {
  @IsString()
  @IsNotEmpty()
  label: string;
}

class Asking {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsArray()
  @IsString({ each: true})
  body?: string[];

  @IsString()
  footer?: string;
}

export class Question {
  
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString({ each: true})
  @IsOptional()
  photos?: string[];
  
  @ValidateNested()
  @IsNotEmpty()
  asking: Asking;

  @ValidateNested({ each: true })
  @IsNotEmpty({ each: true })
  @Type(() => Alternative)
  alternatives: Alternative[];

  @IsNotEmpty()
  @IsNumber()
  correctId: number;

  @IsEnum(QuizCategory)
  @IsNotEmpty()
  category: 'logic' | 'computing' | 'software' | 'security' | 'infrastructure';
}
  
