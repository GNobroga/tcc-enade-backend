import { ArrayMinSize, IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class QuizFinishRequestDTO {

    @IsString({ each: true })
    @IsArray()
    @IsNotEmpty({ each: true})
    correctQuestionIds: string[];

    @IsArray()
    @ArrayMinSize(3)
    @IsNotEmpty()
    timeSpent: number[];

    @IsString()
    @IsOptional()
    category: 'logic' | 'computing' | 'software' | 'infrastructure' | 'security' | 'customized';

    @IsString({ each: true })
    @IsArray()
    @IsOptional()
    excludeCategories: string[];

    @IsBoolean()
    @IsOptional()
    randomize: boolean;
}