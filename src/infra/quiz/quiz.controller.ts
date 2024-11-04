import { Controller, Get, Param } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Quiz } from "./schemas/quiz.schema";

@Controller({ path: 'quizzes', version: '1' })
export default class QuizController {

    constructor(
        @InjectModel(Quiz.name) readonly quizModel: Model<Quiz>
    ) {}

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
                year: 1 
            }
        );

        return quizzes;
    }


}