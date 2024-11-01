import { Body, Controller, Get, Param, Post, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { AchievementRequestDTO } from "../dtos/request/achievement-request.dto";
import AchievementService from "../services/achievement.service";
import { Model } from "mongoose";
import { Achievement } from "../schemas/achievement.schema";
import { InjectModel } from "@nestjs/mongoose";
import { UserAchievement } from "../schemas/user-achievement.schema";
import { CurrentUser } from "src/infra/auth/user-details.decorator";
import FirebaseAuthGuard from "src/infra/auth/firebase-auth.guard";

@UseGuards(FirebaseAuthGuard)
@Controller({ path: 'achievements', version: '1', })
export default class AchievementController {

    constructor(
        readonly achievementService: AchievementService,
        @InjectModel(Achievement.name) readonly achievementModel: Model<Achievement>,
        @InjectModel(UserAchievement.name) readonly userAchievement: Model<UserAchievement>,
    ) {}

    @Get('associate/:achievementId')
    async associateWithUser(@Param('achievementId') achievementId: string, @CurrentUser('uid') userId: string) {
        await this.userAchievement.create({
            userId,
            achievementId
        });
        return {
            created: true,
        }
    }

    @Get()
    async listAll(@CurrentUser('uid') userId: string) {
        const data = await this.achievementService.listAll();
        const output = [];
        for (const achievement of data) {
           const acquired = await this.userAchievement.findOne({
             userId,
             achievementId: achievement.id.toString(),
           });
           achievement['acquired'] = acquired !== null;
           output.push(achievement);
        }
        output.sort((a, b) => Number(a['acquired']) - Number(b['acquired']));
        return output;
    }

    @Get('count')
    async retrieveCountAchievements(@CurrentUser('uid') userId: string) {
        const data = await this.listAll(userId);
        const count =  data.filter(({ acquired }) => acquired).length;
        return { count };
    }

    @Get(":id")
    async findById(@Param('id') id: string) {
        return this.achievementService.findById(id);
    }

    @Post()
    @UsePipes(ValidationPipe)
    async insert(@Body() record: AchievementRequestDTO) {
        return this.achievementService.insert(record);
    }
}