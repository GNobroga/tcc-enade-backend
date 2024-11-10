import { Body, Controller, Get, NotFoundException, Param, Post, Query, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Quiz } from "./schemas/quiz.schema";
import { QuizCompletion } from "./schemas/quiz-completion.schema";
import { CurrentUser } from "../auth/user-details.decorator";
import { QuizFinishRequestDTO } from "./dtos/request/quiz-finish-request.dto";
import { UserStats } from "../user/schemas/user-stats.schema";
import FirebaseAuthGuard from "../auth/firebase-auth.guard";
import { QuizHistory } from "./schemas/quiz-history.schema";

@UseGuards(FirebaseAuthGuard)
@Controller({ path: 'quizzes', version: '1' })
export default class QuizController {

    constructor(
        @InjectModel(Quiz.name) readonly quizModel: Model<Quiz>,
        @InjectModel(QuizCompletion.name) readonly quizCompletionModel: Model<QuizCompletion>,
        @InjectModel(UserStats.name) readonly userStats: Model<UserStats>,
        @InjectModel(QuizHistory.name) readonly quizHistory: Model<QuizHistory>,
    ) {}

    @Get('user/history') 
    async listHistory(@CurrentUser('uid') userId: string) {
        const listQuizHistory = await this.quizHistory.find({
            userId,
        });

        const result = listQuizHistory.map(async ({ quizId, totalQuestions, correctAnswers, incorrectAnswers, startTime, timeSpent }) => {
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
            };
        });

        const filteredResult = await Promise.all(result);
        return filteredResult.filter(obj => obj !== null);
    }

    /// Criar um método para 
    @Post('finish/:quizId')
    @UsePipes(ValidationPipe)
    async finishQuiz(@CurrentUser('uid') userId: string, @Param('quizId') quizId: string, @Body() { excludeCategories, correctQuestionIds, timeSpent, category = 'customized' }: QuizFinishRequestDTO) {
        const quiz = await this.quizModel.findById(quizId);
        if (!quiz) {
            throw new NotFoundException(`Quiz ${quizId} not found`);
        }

        const quizCompletion = await this.quizCompletionModel.findOne({ quizId, category });

        const correctQuestions = quiz.questions.filter(({ _id }) =>  correctQuestionIds.includes(_id.toString()));
        const countCorrectQuestions = correctQuestions.length;
        const countQuestionsLength = quiz.questions.filter(question => category === 'customized' ? !excludeCategories.includes(question.category) : (question.category === category)).length;

        if (quizCompletion) {
            if (!quizCompletion.completed) {
                quizCompletion.correctQuestionIds = [...new Set([...quizCompletion.correctQuestionIds, ...correctQuestionIds]).values()];
                quizCompletion.timeSpent = timeSpent as [number, number, number];
                quizCompletion.completed = countCorrectQuestions >= countQuestionsLength;
                await quizCompletion.save();
            }
        } else if (category !== 'customized') {
            await this.quizCompletionModel.create({
                quizId,
                userId,
                category,
                correctQuestionIds,
                timeSpent,
                completed: countCorrectQuestions >= countQuestionsLength,
            });
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
          
        const score = calculateScore();
          

        await this.userStats.findOneAndUpdate(
            { ownerId: userId },
            {
                $inc: {
                    score, 
                },
            }
        );

        const endTime = new Date();

        const startTime = new Date(endTime.getTime() - (timeSpent[0] * 60 * 60 * 1000)  
                                    - (timeSpent[1] * 60 * 1000)   
                                    - (timeSpent[2] * 1000));      

        await this.quizHistory.create({
            userId,
            quizId,
            totalQuestions: countQuestionsLength,
            correctAnswers: countCorrectQuestions,
            incorrectAnswers: countQuestionsLength - countCorrectQuestions,
            startTime: [startTime.getHours(), startTime.getMinutes(), startTime.getSeconds()],
            score,
            timeSpent,
        });

        return { created: true };
    }

    // Se não tiver a categoria é porque é quiz selection
    @Get(':id/category/:name')
    async listByCategoryName(@Param('id') quizId: string, @Param('name') category: string) {
        const quiz = await this.quizModel.findOne(
            { _id: quizId },
            {
                questions: {
                    $filter: {
                        input: "$questions",
                        as: "question",
                        cond: { $eq: ["$$question.category", category] }
                    }
                },
            }
        );
        this.shuffleQuestions(quiz);
        return quiz;
    }

    @Get('category/:name')
    async list(@Param('name') category: string) {
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
                timeSpent: quizCompletion?.timeSpent ?? [0, 0, 0],
                completed: quizCompletion?.completed ?? false,
            };
        }));
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