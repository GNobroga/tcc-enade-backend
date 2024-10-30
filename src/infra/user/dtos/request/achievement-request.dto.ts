import { IsEnum, IsNotEmpty, IsNumber, IsString, ValidateNested } from "class-validator";
import { AchievementType } from "../../schemas/achievement.schema";
import { Type } from "class-transformer";


class GoalDTO {
    @IsString()
    description: string;

    @IsNumber()
    @IsNotEmpty()
    count: number;
}

export class AchievementRequestDTO {
    @IsString()
    @IsNotEmpty()
    header: string;

    @IsString()
    @IsNotEmpty()
    detail: string;

    @IsEnum(AchievementType)
    @IsNotEmpty()
    type: AchievementType;

    @ValidateNested()
    @IsNotEmpty()
    @Type(() => GoalDTO)
    goal: GoalDTO;

    @IsString()
    @IsNotEmpty()
    imageUrl: string;
}