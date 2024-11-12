import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Document, Model } from "mongoose";
import FirebaseAuthGuard from "src/infra/auth/firebase-auth.guard";
import { CurrentUser } from "src/infra/auth/user-details.decorator";
import { AchievementRequestDTO } from "../dtos/request/achievement-request.dto";
import { Achievement, AchievementType } from "../schemas/achievement.schema";
import { UserAchievement } from "../schemas/user-achievement.schema";
import { UserStats } from "../schemas/user-stats.schema";
import { DaySequence } from "../schemas/day-sequence.schema";

@UseGuards(FirebaseAuthGuard)
@Controller({ path: 'achievements', version: '1' })
export default class AchievementController {

    constructor(
        @InjectModel(Achievement.name) readonly achievementModel: Model<Achievement>,
        @InjectModel(UserAchievement.name) readonly userAchievementModel: Model<UserAchievement>,
        @InjectModel(UserStats.name) readonly userStatsModel: Model<UserStats>,
        @InjectModel(DaySequence.name) readonly daySequenceModel: Model<DaySequence>,
    ) {}


    @Get('user/:ownerId')
    async listAll(@Param('ownerId') ownerId: string) {
        const achievements = await this.achievementModel.find();
        const userAchievementsIds = (await this.userAchievementModel.find({ ownerId }))
            .map(({ achievementId }) => achievementId);

        const result = achievements.map(achievement => {
            const id = achievement._id.toString();
            return {
                ...this.mapToResponse(achievement),
                acquired: userAchievementsIds.includes(id),
            }
        });

        result.sort((obj1, obj2) => Number(obj2.acquired) - Number(obj1.acquired));

        return result;
    }

    @Get('check/user')
    async check(@CurrentUser('uid') ownerId: string) {

        const [stats, daysSequence] = await Promise.all([
            this.userStatsModel.findOne({ ownerId }),
            this.daySequenceModel.findOne({ ownerId })
        ]);

        if (!stats) throw new BadRequestException('User stats not found');
        if (!daysSequence) throw new BadRequestException('Days sequence data not found');

        const achievements = await this.achievementModel.find();
        const userAchievements = await this.userAchievementModel.find({ ownerId });
        const acquiredAchievements = new Set(userAchievements.map(ua => ua.achievementId ));

        const listUserRanking = await this.getListUserRanking();

        const getPositionUserRanking = () => {
            const rankingPosition = listUserRanking.findIndex(userRanking => userRanking.ownerId === ownerId);
            return rankingPosition;
        };
        

        function checkGoal(type: string, goal: number): boolean {
            switch (type) {
                case AchievementType.SOCIAL:
                    return stats.countFriends >= goal;
                case AchievementType.TRIAL_PERIOD:
                    return stats.trialPeriod;
                case AchievementType.LEARNING:
                    return stats.totalAnsweredQuestions >= goal;
                case AchievementType.RANKING:
                    const rankPosition = getPositionUserRanking();
                    if (rankPosition === -1) return false;
                    return (rankPosition + 1) === goal;
                case AchievementType.CONSECUTIVE_DAYS:
                    return daysSequence.days.filter(day => day).length >= goal;
                default:
                    return false;
            }
        }

        const newAchievements = achievements
            .filter(({ goal, type, _id }) => checkGoal(type, goal) && !acquiredAchievements.has(_id.toString()))
            .map(({ _id }) => ({ ownerId, achievementId: _id }));

        if (newAchievements.length > 0) {
            await this.userAchievementModel.insertMany(newAchievements);
        }


        return { hasNew: newAchievements.length > 0 };
    }

    async getListUserRanking() {
        const userStats = await this.userStatsModel.find()
            .sort({ score: -1, createdAt: 1 }).limit(20);
        return userStats.map(({ score, ownerId }) => ({ score, ownerId }));
    }

    @Get('count') 
    async countUserAchievements(@CurrentUser('uid') ownerId: string) {
        const count = await this.userAchievementModel.countDocuments({ ownerId });
        return { count };
    }

    @Get(":id")
    async findById(@Param('id') id: string, @CurrentUser('uid') ownerId: string) {
        const achievement = await this.achievementModel.findById(id);
        if (!achievement) throw new NotFoundException('achievement not found');
        const achievementAcquired = await this.userAchievementModel.findOne({ ownerId, achievementId: achievement._id });
        
        
        return {
            ...this.mapToResponse(achievement),
            acquired: achievementAcquired !== null,
            acquiredAt: achievementAcquired?.createdAt ?? undefined,
        };
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
            _id,
            header,
            detail,
            type,
            goal,
            imageUrl,
            createdAt,
        };
    }
}