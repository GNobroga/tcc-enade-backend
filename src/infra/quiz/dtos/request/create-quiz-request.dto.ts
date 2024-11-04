import { IsArray, IsNotEmpty, IsNumber, ValidateNested } from "class-validator";
import { Question } from "./add-questions-request.dto";
import { Type } from "class-transformer";

export class CreateQuizRequestDTO {
    
    @IsNumber()
    year: number;

    @IsNotEmpty()
    @ValidateNested({ each: true })
    @IsArray()
    @Type(() => Question)
    questions: Question[];
}