import { IsNotEmpty, IsString } from "class-validator";

export class AchievementRequestDTO {
    @IsString()
    @IsNotEmpty()
    header: string;

    @IsString()
    @IsNotEmpty()
    detail: string;
}