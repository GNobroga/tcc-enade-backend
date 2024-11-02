import { Body, Controller, Get, NotFoundException, Param, Post, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Document, Model } from "mongoose";
import FirebaseAuthGuard from "src/infra/auth/firebase-auth.guard";
import { CurrentUser } from "src/infra/auth/user-details.decorator";
import { AchievementRequestDTO } from "../dtos/request/achievement-request.dto";
import { Achievement } from "../schemas/achievement.schema";
import { UserAchievement } from "../schemas/user-achievement.schema";

@UseGuards(FirebaseAuthGuard)
@Controller({ path: 'achievements', version: '1', })
export default class AchievementController {

    constructor(
        @InjectModel(Achievement.name) readonly achievementModel: Model<Achievement>,
        @InjectModel(UserAchievement.name) readonly userAchievement: Model<UserAchievement>,
    ) {}

    @Get()
    async listAll(@CurrentUser('uid') ownerId: string) {
        const achivements = await this.achievementModel.find();
        const userAchievementsIds = (await this.userAchievement.find({ ownerId }))
            .map(({ _id }) => _id.toString());

        return achivements.map(achievement => {
            const id = achievement._id.toString();
            return {
                ...this.mapToResponse(achievement),
                acquired: userAchievementsIds.includes(id),
            }
        });
    }

    @Get('count') 
    async countUserAchievements(@CurrentUser('uid') ownerId: string) {
        const count = await this.userAchievement.countDocuments({ ownerId });
        return { count };
    }

    @Get(":id")
    async findById(@Param('id') id: string) {
        const achievement = await this.achievementModel.findById(id);
        if (!achievement) throw new NotFoundException('achievement not found');
        return this.mapToResponse(achievement);
    }

    @Post()
    @UsePipes(ValidationPipe)
    async insert(@Body() record: AchievementRequestDTO) {
        await this.achievementModel.create(record);
        return { created: true };
    }

    private mapToResponse(document: Document) {
        const { _id, header, detail, type, goal, imageUrl, createdAt } = document.toObject();
        return {
            id: _id,
            header,
            detail,
            type,
            goal,
            imageUrl,
            createdAt,
        };
    }
}