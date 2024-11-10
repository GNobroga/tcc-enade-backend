import { Controller, Delete, Get, NotFoundException, UseGuards } from '@nestjs/common';
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
    async getUserStats(@CurrentUser('uid') ownerId: string) {
       const stats = await this.userStatsModel.findOne({ ownerId });
       if (!stats) {
            throw new NotFoundException('Stats for user ' + ownerId + ' not found');
       }
       return {
            _id: stats._id,
            averageResponseTime: stats.averageResponseTime,
            correctAnswersByCategory: stats.correctAnswersByCategory,
            correctAnswersCount: stats.correctAnswersCount,
            countFriends: stats.countFriends,
            score: stats.score,
            incorrectAnswersCount: stats.incorrectAnswersCount,
            totalAnsweredQuestions: stats.totalAnsweredQuestions,
            trialPeriod: stats.trialPeriod,
       } as UserStatsResponseDto;
    }

    @Delete()
    async removeUser(@CurrentUser('uid') ownerId: string) {
        await this.userStatsModel.findOneAndDelete({ ownerId });
        await this.daySequenceModel.findOneAndDelete({ ownerId });
    }

    @Get('initialize-progress')
    async initializeProgress(@CurrentUser('uid') ownerId: string) {

        const existsUserStatsById = async () => {
            return (await this.userStatsModel.findOne({
                ownerId,
            })) != null;
        }

        if (await existsUserStatsById()) return;

        await this.userStatsModel.create({
            ownerId,
            correctAnswersByCategory: {
                logic: 0,
                computing: 0,
                software: 0,
                security: 0,
                infrastructure: 0,
            },
        });

        await this.daySequenceModel.create({
            ownerId,
            days: [false, false, false, false, false, false, false], 
            startDate: new Date(),
            isComplete: false,
        });

        return {
            initialized: true,
        };
    }


}
