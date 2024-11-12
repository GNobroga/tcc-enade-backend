import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Query, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import FirebaseAuthGuard from "../auth/firebase-auth.guard";
import { CurrentUser } from "../auth/user-details.decorator";
import { DaySequence } from "../user/schemas/day-sequence.schema";
import { UserStats } from "../user/schemas/user-stats.schema";
import { QuizFinishRequestDTO } from "./dtos/request/quiz-finish-request.dto";
import { QuizCompletion } from "./schemas/quiz-completion.schema";
import { QuizHistory } from "./schemas/quiz-history.schema";
import { Quiz } from "./schemas/quiz.schema";

@UseGuards(FirebaseAuthGuard)
@Controller({ path: 'quizzes', version: '1' })
export default class QuizController {

    constructor(
        @InjectModel(Quiz.name) readonly quizModel: Model<Quiz>,
        @InjectModel(QuizCompletion.name) readonly quizCompletionModel: Model<QuizCompletion>,
        @InjectModel(UserStats.name) readonly userStatsModel: Model<UserStats>,
        @InjectModel(QuizHistory.name) readonly quizHistoryModel: Model<QuizHistory>,
        @InjectModel(DaySequence.name) readonly daySequenceModel: Model<DaySequence>,
    ) {}

    @Get('user/history') 
    async listHistory(@CurrentUser('uid') userId: string) {
        const listQuizHistory = await this.quizHistoryModel.find({
            userId,
        });

        const result = listQuizHistory.map(async ({ quizId, score, totalQuestions, correctAnswers, incorrectAnswers, startTime, timeSpent }) => {
            const quiz = await this.quizModel.findById(quizId);
            if (!quiz) return null;
            return {
                year: quiz.year,
                quizId,
                totalQuestions,
                correctAnswers,
                incorrectAnswers,
                startTime,
                timeSpent,
                score
            };
        });

        const filteredResult = await Promise.all(result);
        return filteredResult.filter(obj => obj !== null);
    }

    @Post('finish/:quizId')
    @UsePipes(ValidationPipe)
    async finishQuiz(@CurrentUser('uid') userId: string, @Param('quizId') quizId: string, @Body() { randomize = false, excludeCategories, correctQuestionIds, timeSpent, category = 'customized' }: QuizFinishRequestDTO) {
        const quiz = await this.quizModel.findById(quizId);
        if (!quiz) {
            throw new NotFoundException(`Quiz ${quizId} not found`);
        }

        const quizCompletion = await this.quizCompletionModel.findOne({ quizId, category });
        const correctQuestions = quiz.questions.filter(({ _id }) =>  correctQuestionIds.includes(_id.toString()));
        const countCorrectQuestions = correctQuestions.length;
        const countQuestionsLength = randomize ? 1 : quiz.questions.filter(question => category === 'customized' ? !excludeCategories.includes(question.category) : (question.category === category)).length;

        if (!randomize) {
            if (quizCompletion && !quizCompletion.completed) {
                quizCompletion.correctQuestionIds = [...new Set([...quizCompletion.correctQuestionIds, ...correctQuestionIds]).values()];
                quizCompletion.timeSpent = timeSpent as [number, number, number];
                quizCompletion.completed = countCorrectQuestions >= countQuestionsLength;
                await quizCompletion.save();
            } else if (category !== 'customized') {
                await this.quizCompletionModel.deleteMany();
                await this.quizCompletionModel.create({
                    quizId,
                    userId,
                    category,
                    correctQuestionIds,
                    timeSpent,
                    completed: countCorrectQuestions >= countQuestionsLength,
                });
            }
        }

        function calculateScore() {
            const difficultyPoints = {
              easy: 5,
              medium: 10,
              hard: 15,
            };
          
            return correctQuestions
              .map(({ difficulty }) => difficultyPoints[difficulty] || 0) 
              .reduce((acc, score) => acc + score, 0);
          }
        

        function getRandomMultiplier() {
            return 1 + Math.random() * 2;
        }

        const baseScore = calculateScore();
        const score = randomize ? Math.ceil(baseScore * getRandomMultiplier()) : baseScore;

        const daySequence = await this.daySequenceModel.findOne({ ownerId: userId });

        if (!daySequence) {
            throw new NotFoundException('No day sequence found');
        }          

        // Day sequence
        const days = daySequence.days;
        const currentWeekDay = new Date().getDay();

        function countDaysOfCurrentYear() {
            const currentDate = new Date();
            const lastMonthOfYear = 12;
            let count = 0;
            for (let i = 0 ; i < lastMonthOfYear ; i++) {
                const date = new Date(currentDate.getFullYear(), i + 1, 0); 
                count += date.getDate();
            }
            return count;
        }

        if (!days[currentWeekDay]) {
            days[currentWeekDay] = true;
         

            if (daySequence.numberOfOffensives > countDaysOfCurrentYear())  {
                daySequence.numberOfOffensives = 0;
                daySequence.startDate = new Date();
            }

            daySequence.numberOfOffensives++;
            daySequence.startDate ||= new Date();

            console.log(daySequence.numberOfOffensives);
    
            await daySequence.save();
        }


        function timeToSeconds(timeSpent: number[]) {
            const [hours, minutes, seconds] = timeSpent;
            return hours * 3600 + minutes * 60 + seconds;
        }
        

        await this.userStatsModel.findOneAndUpdate(
            { ownerId: userId },
            [
                {
                    $set: {
                        score: { $add: ["$score", score] },
                        totalAnsweredQuestions: { $add: ["$totalAnsweredQuestions", countQuestionsLength] },
                        incorrectAnswersCount: { $add: ["$incorrectAnswersCount", countQuestionsLength - countCorrectQuestions] },
                        correctAnswersCount: { $add: ["$correctAnswersCount", countCorrectQuestions] },
                        averageResponseTime: {
                            $cond: {
                                if: { $gt: ["$totalAnsweredQuestions", 0] },
                                then: {
                                    $divide: [
                                        { 
                                            $add: [
                                                { $multiply: ["$averageResponseTime", "$totalAnsweredQuestions"] }, 
                                                { $convert: { input: timeToSeconds(timeSpent), to: "double" } } 
                                            ]
                                        },
                                        { $add: ["$totalAnsweredQuestions", countQuestionsLength] } 
                                    ]
                                },
                                else: { $convert: { input: timeToSeconds(timeSpent), to: "double" } } 
                            }
                        }
                    }
                }
            ],
        );
        
        const endTime = new Date();

        const startTime = new Date(endTime.getTime() - (timeSpent[0] * 60 * 60 * 1000)  
                                    - (timeSpent[1] * 60 * 1000)   
                                    - (timeSpent[2] * 1000));      

        await this.quizHistoryModel.create({
            userId,
            quizId,
            totalQuestions: countQuestionsLength,
            correctAnswers: countCorrectQuestions,
            incorrectAnswers: countQuestionsLength - countCorrectQuestions,
            startTime: [startTime.getHours(), startTime.getMinutes(), startTime.getSeconds()],
            score,
            timeSpent,
        });

        return { created: true, score };
    }

    @Get('has-questions/:quizId')
    async quizHasQuestions(@Param('quizId') quizId: string) {
        const quiz = await this.quizModel.findById(quizId);
        const categories = new Set(quiz.questions.map(({ category }) => category));
        return [...categories.values()];
    }

    @Get(':id/category/:name')
    async listByCategoryName(
        @Param('id') quizId: string,
        @Param('name') category: string,
        @Query('limit') limitString: string
    ) {
        // Verifica e converte o limitString em um número, caso válido
        let limit: number | undefined = undefined;
        if (limitString) {
            const parsedLimit = parseInt(limitString, 10);
            if (parsedLimit > 0) limit = parsedLimit;
        }


        const doc = await this.quizModel.findOne(
            { _id: quizId },
            {
                questions: limit ? {
                    $slice: [
                        {
                            $filter: {
                                input: "$questions",
                                as: "question",
                                cond: { $eq: ["$$question.category", category] }
                            }
                        },
                        limit
                    ]
                } : {
                    $filter: {
                        input: "$questions",
                        as: "question",
                        cond: { $eq: ["$$question.category", category] }
                    }
                }
            }
        );

        if (!doc) {
            throw new Error(`Quiz with ID ${quizId} not found`);
        }

        this.shuffleQuestions(doc);

        return doc;
    }


    @Get('category/:name')
    async list(@Param('name') category: string, @CurrentUser('uid') userId: string) {
        const quizzes = await this.quizModel.find(
            {},
            {
                questions: {
                    $filter: {
                        input: "$questions",
                        as: "question",
                        cond: { $eq: ["$$question.category", category] }
                    }
                },
                year: 1,
                timeSpent: 1,
                completed: 1,
                id: 1,
            }
        );

        const filteredQuizzes = quizzes.filter(quiz => quiz.questions.length > 0);

        return await Promise.all(filteredQuizzes.map(async quiz => {
            this.shuffleQuestions(quiz);

            const quizId = quiz._id;
   
            const quizCompletion = await this.quizCompletionModel.findOne({
                quizId,
                category,
                userId,
            });

            const correctQuestionIds = quizCompletion?.correctQuestionIds ?? [];
            
            return {
                _id: quiz._id,
                year: quiz.year,
                questions: quiz.questions.map(({  _id, title, content, photos, asking, alternatives, correctId, difficulty, category }) => ({
                    _id,
                    title,
                    content,
                    photos,
                    asking,
                    alternatives,
                    correctId,
                    category,
                    difficulty,
                    done: correctQuestionIds.includes(_id.toString()),
                })),
                timeSpent: quizCompletion?.completed ? quizCompletion?.timeSpent : [0, 0, 0],
                completed: quizCompletion?.completed ?? false,
            };
        }));
    }

    // Pegar a quantidade de quizzes e quantos estão completos por categoria
    @Get('category-progress/:category')
    async getCategoryQuizProgress(
        @CurrentUser('uid') ownerId: string, 
        @Param('category') category: string
    ) {
        try {
        
            const listQuizCompletion = await this.quizCompletionModel.find({
                userId: ownerId,
                category,
            });

    
            const quizzes = await this.quizModel.find(
                { 'questions.category': category }, 
                { 'questions.$': 1 } 
            );

          
            const filteredQuizzes = quizzes.filter(quiz => quiz.questions.length > 0);

        
            const completedQuizzes = listQuizCompletion.reduce(
                (count, { completed }) => count + (completed ? 1 : 0), 0
            );


            return {
                totalQuizzes: filteredQuizzes.length,
                completedQuizzes,
            };
        } catch (error) {
            throw new BadRequestException('Erro ao calcular o progresso das categorias: ' + error.message);
        }
    }



    @Get('years')
    async listQuizYears() {
        const quizzes = await this.quizModel.find();
        return {
            data: quizzes.map(({ year, _id }) => ({ id: _id, year }) ),
        }
    }

    @Get(':id')
    async getById(@Param('id') id: string, @Query('excludeCategories') json: string, @Query('limit') limitValue: string) {
        const excludeCategories = json ? JSON.parse(json) : [];
        const doc = this.quizModel.findOne(
            { _id: id },
            {
                questions: {
                    $filter: {
                        input: "$questions",
                        as: "question",
                        cond: { $not: { $in: ["$$question.category", excludeCategories] } }
                    }
                },
                year: 1,
                timeSpent: 1,
                completed: 1,
                id: 1,
            },
        );

        const quiz = limitValue ? await doc.slice('questions', parseInt(limitValue)) : await doc; 

        this.shuffleQuestions(quiz);

        return quiz;
    }


    private shuffleQuestions(quiz: Quiz) {
        const size = quiz.questions.length;
        for (let i = size - 1 ; i > 0 ; i--) {
            const randomIndex = Math.floor(Math.random() * (i + 1));
            const temp = quiz.questions[i];
            quiz.questions[i] = quiz.questions[randomIndex];
            quiz.questions[randomIndex] = temp;
        }
       
    }
}