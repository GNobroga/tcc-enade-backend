import { Controller, Delete, Get, InternalServerErrorException, Logger, NotFoundException, Param, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment';
import { Model } from 'mongoose';
import FirebaseAuthGuard from 'src/infra/auth/firebase-auth.guard';
import { CurrentUser } from 'src/infra/auth/user-details.decorator';
import { DaySequence } from '../schemas/day-sequence.schema';
import { UserStats } from '../schemas/user-stats.schema';
import firebaseAdmin from 'firebase-admin';

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
    displayName?: string;
}

export interface UserDaysSequenceResponse {
    _id: string;
    days: boolean[];
    numberOfOffensives: number;
}

@UseGuards(FirebaseAuthGuard)
@Controller({ path: 'users', version: '1', })
export class UserController {

    readonly logger = new Logger(UserController.name);

    constructor(
        @InjectModel(UserStats.name) readonly userStatsModel: Model<UserStats>,
        @InjectModel(DaySequence.name) readonly daySequenceModel: Model<DaySequence>,
    ) {}

    @Get('can-attempt-random-question')
    async checkRandomQuestionEligibility(@CurrentUser('uid') ownerId: string): Promise<{ canAttempt: boolean }> {
        const stats = await this.userStatsModel.findOne({ ownerId });
    
        if (!stats) {
            throw new NotFoundException(`Statistics not found for user with ID: ${ownerId}`);
        }
    
        return { canAttempt: stats.canAccessRandomQuestion };
    }

    @Get('disable-random-question-access')
    async disableRandomQuestionAccess(@CurrentUser('uid') ownerId: string) {
        await this.userStatsModel.updateOne({ ownerId }, { canAccessRandomQuestion: false });
        return { disabled: true };
    }

    

    @Get('check/day-sequence')
    async checkDaySequence(@CurrentUser('uid') ownerId: string) {
        const TOTAL_DAYS_IN_WEEK = 7;
        const daySequence = await this.daySequenceModel.findOne({ ownerId });

        if (!daySequence) throw new NotFoundException('Day Sequence not found');
        if (!daySequence.startDate) return { checked: false };

        const resetDate = (date: Date) => moment(date).set({ hour: 0, minute: 0, second: 0, millisecond: 0 });

        const startDate = resetDate(daySequence.startDate);
        const today = resetDate(new Date());

        if (today.isSame(startDate, 'day')) {
            return { checked: false }; 
        }

        const listOfDays = daySequence.days;
        const totalCompletedDays = listOfDays.filter(day => day).length;
        
        const finalDate = moment(startDate).add(listOfDays.length, 'days');

        if (finalDate.isBefore(today, 'day')) {
            this.logger.log('Resetting sequence as today is after final date');
            daySequence.numberOfOffensives = 0;
            daySequence.days = listOfDays.map(() => false);
            daySequence.startDate = null;
        } else if (totalCompletedDays === TOTAL_DAYS_IN_WEEK && finalDate.clone().add(1, 'day').isSame(today, 'day')) {
            this.logger.log('Weekly sequence completed, resetting for new week');
            daySequence.days = listOfDays.map(() => false);
            daySequence.startDate = today.toDate();
        } else {
            const currentDayOfWeek = today.day();
            const startDayOfWeek = startDate.day();
            
            if (listOfDays.slice(startDayOfWeek, currentDayOfWeek).includes(false)) {
                this.logger.log('Missing days in sequence, resetting offenses');
                daySequence.numberOfOffensives = 0;
            }
        }

        await daySequence.save();
        return { checked: true };
    }


    
    @Get('days-sequence')
    async getDaysSequence(@CurrentUser('uid') ownerId: string) {
       const daysSequence = await this.daySequenceModel.findOne({ ownerId });
       if (!daysSequence) { 
            throw new NotFoundException('User does not have a day sequence');
       }
       const { _id, days, numberOfOffensives } = daysSequence;
       return {
        _id, days, numberOfOffensives
       } as UserDaysSequenceResponse;
    }

    @Get('stats/:ownerId')
    async getStatsByOwnerId(@Param('ownerId') ownerId: string) {
        const stats = await this.userStatsModel.findOne({ ownerId });

        if (!stats) {
            throw new NotFoundException(`Stats for user with ID ${ownerId} not found`);
        }

        const { displayName } = await firebaseAdmin.auth().getUser(ownerId);
 
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
            displayName,
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
            return { initialized: false };
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
