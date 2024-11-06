import { Controller, Get, Param, Query } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Quiz } from "./schemas/quiz.schema";

@Controller({ path: 'quizzes', version: '1' })
export default class QuizController {

    constructor(
        @InjectModel(Quiz.name) readonly quizModel: Model<Quiz>
    ) {}

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

        return quizzes.filter(quiz => quiz.questions.length > 0);
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