import { ConflictException, Controller, Delete, Get, InternalServerErrorException, NotFoundException, Patch, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import FirebaseAuthGuard from 'src/infra/auth/firebase-auth.guard';
import { CurrentUser } from 'src/infra/auth/user-details.decorator';
import { DaySequence } from '../schemas/day-sequence.schema';
import { UserStats } from '../schemas/user-stats.schema';

export interface UserStatsResponseDto {
    _id: string;
    totalAnsweredQuestions: number;
    incorrectAnswersCount: number;
    correctAnswersCount: number;
    score: number;
    averageResponseTime: number;
    countFriends: number;
    correctAnswersByCategory: Map<string, number>;
    trialPeriod: boolean;
    dailyHintCount: number;
}

export interface UserDaysSequenceResponse {
    id: string;
    days: boolean[];
    startDate: Date;
}

@UseGuards(FirebaseAuthGuard)
@Controller({ path: 'users', version: '1', })
export class UserController {

    constructor(
        @InjectModel(UserStats.name) readonly userStatsModel: Model<UserStats>,
        @InjectModel(DaySequence.name) readonly daySequenceModel: Model<DaySequence>,
    ) {}

    
    @Get('days-sequence')
    async getDaysSequence(@CurrentUser('uid') ownerId: string) {
       const daysSequence = await this.daySequenceModel.findOne({ ownerId });
       if (!daysSequence) { 
            throw new NotFoundException('User does not have a day sequence');
       }
       const { startDate ,_id, days,  } = daysSequence;
       return {
        startDate, id: _id, days
       } as UserDaysSequenceResponse;
    }

    @Get('stats')
    async getUserStats(@CurrentUser('uid') ownerId: string): Promise<UserStatsResponseDto> {
        const stats = await this.userStatsModel.findOne({ ownerId });

        if (!stats) {
            throw new NotFoundException(`Stats for user with ID ${ownerId} not found`);
        }

        const {
            _id,
            averageResponseTime,
            correctAnswersByCategory,
            correctAnswersCount,
            countFriends,
            score,
            dailyHintCount,
            incorrectAnswersCount,
            totalAnsweredQuestions,
            trialPeriod,
        } = stats;

        return {
            _id,
            averageResponseTime,
            correctAnswersByCategory,
            correctAnswersCount,
            countFriends,
            score,
            dailyHintCount,
            incorrectAnswersCount,
            totalAnsweredQuestions,
            trialPeriod,
        } as UserStatsResponseDto;
    }

    @Delete()
    async removeUser(@CurrentUser('uid') ownerId: string): Promise<void> {
      const stats = await this.userStatsModel.findOneAndDelete({ ownerId });
      if (!stats) {
        throw new NotFoundException(`User stats with ID ${ownerId} not found`);
      }
    
      const daySequence = await this.daySequenceModel.findOneAndDelete({ ownerId });
      if (!daySequence) {
        throw new NotFoundException(`Day sequence for user with ID ${ownerId} not found`);
      }

    }

    @Get('initialize-progress')
    async initializeProgress(@CurrentUser('uid') ownerId: string) {
        const existsUserStatsById = await this.userStatsModel.findOne({ ownerId });

        if (existsUserStatsById) {
            throw new ConflictException('User progress has already been initialized.');
        }

        try {
            const [userStats, daySequence] = await Promise.all([
                this.userStatsModel.create({
                    ownerId,
                    correctAnswersByCategory: {
                        logic: 0,
                        computing: 0,
                        software: 0,
                        security: 0,
                        infrastructure: 0,
                    },
                }),
                this.daySequenceModel.create({
                    ownerId,
                    days: [false, false, false, false, false, false, false],
                    startDate: new Date(),
                    isComplete: false,
                }),
            ]);

            return {
                initialized: true,
                userStats,
                daySequence,
            };
        } catch (error) {
            throw new NotFoundException('Error initializing user progress: ' + error.message);
        }
    }

    @Get('decrease-daily-hint')
    async decreaseDailyHintCount(@CurrentUser('uid') ownerId: string) {
        try {
            const userStats = await this.userStatsModel.findOne({ ownerId });

            if (!userStats) {
              throw new Error('User not found');
            }
        
            if (userStats.dailyHintCount > 0) {
                await this.userStatsModel.findOneAndUpdate(
                { ownerId },
                { $inc: { dailyHintCount: -1 } },
                { new: true }
              );
            return { updated: true };
            } else {
                return { updated: false };
            }

        } catch (err) {
            throw new InternalServerErrorException('Failed to decrease daily hint count');
        }
    }

}
