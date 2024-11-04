import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateQuizRequestDTO {
    
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNumber()
    year: number;
}