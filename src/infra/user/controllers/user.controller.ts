import { Controller, Delete, Get, InternalServerErrorException, Logger, NotFoundException, Param, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import firebaseAdmin from 'firebase-admin';
import * as moment from 'moment';
import { Model } from 'mongoose';
import FirebaseAuthGuard from 'src/infra/auth/firebase-auth.guard';
import { CurrentUser } from 'src/infra/auth/user-details.decorator';
import { Note } from 'src/infra/note/note.schema';
import { QuizCompletion } from 'src/infra/quiz/schemas/quiz-completion.schema';
import { QuizHistory } from 'src/infra/quiz/schemas/quiz-history.schema';
import { Chat } from 'src/infra/websocket/schemas/chat.schema';
import { UserFriend } from 'src/infra/websocket/schemas/user-friend.schema';
import { DaySequence } from '../schemas/day-sequence.schema';
import { UserAchievement } from '../schemas/user-achievement.schema';
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
    displayName?: string;
    photoUrl?: string;
    rankingPosition: number;
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
        @InjectModel(UserAchievement.name) readonly userAchievementModel: Model<UserAchievement>,
        @InjectModel(Note.name) readonly noteModel: Model<Note>,
        @InjectModel(UserFriend.name) readonly userFriendModel: Model<UserFriend>,
        @InjectModel(QuizHistory.name) readonly quizHistoryModel: Model<QuizHistory>,
        @InjectModel(QuizCompletion.name) readonly quizCompletionModel: Model<QuizCompletion>,
        @InjectModel(Chat.name) readonly chatModel: Model<Chat>,
    ) {}

    @Delete()
    async removeUser(@CurrentUser('uid') ownerId: string): Promise<void> {
        await this.userStatsModel.deleteOne({ ownerId });
        await this.daySequenceModel.deleteOne({ ownerId });
        await this.userAchievementModel.deleteMany({ ownerId });
        await this.noteModel.deleteMany({ ownerId });
        await this.userFriendModel.deleteMany({ 
            $or: [
                { userId: ownerId },
                { friendId: ownerId },
            ]
         });
        await this.quizHistoryModel.deleteMany({ userId: ownerId });
        await this.quizCompletionModel.deleteMany({ userId: ownerId });
        await this.chatModel.deleteMany({
            $or: [
                { participantOneId: ownerId },
                { participantTwoId: ownerId },
            ]
        })
    }

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
        const daySequence = await this.daySequenceModel.findOne({ ownerId });

        if (!daySequence) throw new NotFoundException('Day Sequence not found');
        if (!daySequence.startDate) return { checked: false };

        const resetDate = (date: Date) => moment(date).set({ hour: 0, minute: 0, second: 0, millisecond: 0 });

        const startDate = resetDate(daySequence.startDate);
        const today = resetDate(new Date());

        const listOfDays = daySequence.days;
        Logger.log('UserController::checkDaySequence days: ', JSON.stringify(listOfDays))
        const currentDayOfWeek = today.day();

        const startDateTimestamp = startDate.clone().valueOf();

        const todayTimestampStartWeek = today.clone().startOf('week').valueOf();
        const todayTimestampEndWeek = today.clone().endOf('week').valueOf();
        
        // Se a data inicio não estiver dentro da semana eu reseto.
        if (startDateTimestamp < todayTimestampStartWeek || startDateTimestamp > todayTimestampEndWeek) { 
            this.logger.log('Resetting sequence as today is after final date');
            daySequence.numberOfOffensives = 0;
            daySequence.days = listOfDays.map(() => false);
            daySequence.startDate = today.toDate();
        } else {
            const startDateDayWeek = startDate.day();
            
            const partialDays = listOfDays.slice(startDateDayWeek, currentDayOfWeek);

            this.logger.log('Entering in the else block in checkDaySequence with day week: ', JSON.stringify({
                startDateDayWeek,
                partialDays,
            }));
            
            if (partialDays.includes(false)) { // se ficou um dia anterior sem marcar eu reseto tudo.
                this.logger.log('Missing days in sequence, resetting offenses');
                daySequence.numberOfOffensives = 0;
            }
        }


        await daySequence.save();

        return { checked: true };
    }


    
    @Get('days-sequence')
    async getDaysSequence(@CurrentUser('uid') ownerId: string) {
        try {
            await this.checkDaySequence(ownerId);
            Logger.log('Checking day sequence in UserController::getDaysSequence with success');
       } catch {
            Logger.log('Failure to check day sequence in UserController::getDaysSequence with success');
       }
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

        const { displayName, photoURL } = await firebaseAdmin.auth().getUser(ownerId);
 
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
            createdAt
        } = stats;

        const rankingPosition = await this.userStatsModel.countDocuments({
            $or: [
                { score: { $gt: score } },
                { score: score, createdAt: { $lt: createdAt } }
            ]
        }) + 1;

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
            rankingPosition,
            photoUrl: photoURL,
        } as UserStatsResponseDto;
    }


    @Get('stats')
    async getUserStats(@CurrentUser('uid') ownerId: string): Promise<UserStatsResponseDto> {
        const userStat = await this.userStatsModel.findOne({ ownerId });
        if (!userStat) {
            throw new Error('User stats not found');
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
            createdAt,
        } = userStat;

        const rankingPosition = await this.userStatsModel.countDocuments({
            $or: [
                { score: { $gt: score } },
                { score: score, createdAt: { $lt: createdAt } }
            ]
        }) + 1;

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
            rankingPosition,
            trialPeriod,
        } as UserStatsResponseDto;
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
                    startDate: null,
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
