
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsPositive, IsString, ValidateNested } from "class-validator";
import { QuestionCategoryEnum } from "../../enums/question-category.enum";

class Alternative {

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  id: number;

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

class Question {

  @IsNumber()
  @IsPositive()
  id: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString({ each: true})
  photos?: string[];
  
  @ValidateNested()
  @IsNotEmpty()
  asking: Asking;

  @ValidateNested({ each: true })
  @IsNotEmpty()
  alternatives: Alternative[];

  @IsNotEmpty()
  @IsNumber()
  correctId: number;

  @IsEnum(QuestionCategoryEnum)
  @IsNotEmpty()
  category: 'logic' | 'computing' | 'software' | 'security' | 'infrastructure';
}
  
export class AddQuestionsRequestDTO {

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @IsArray()
  questions: Question[];

}