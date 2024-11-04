import { BadRequestException, Body, Controller, NotFoundException, Param, Post, UsePipes, ValidationPipe } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AddQuestionsRequestDTO } from "./dtos/request/add-questions-request.dto";
import { CreateQuizRequestDTO } from "./dtos/request/create-quiz-request.dto";
import { Quiz } from "./schemas/quiz.schema";

@Controller({ path: 'quizzes', version: '1' })
export default class QuizController {

    constructor(
        @InjectModel(Quiz.name) readonly quizModel: Model<Quiz>
    ) {}

    @UsePipes(ValidationPipe)
    @Post()
    async create(@Body() record: CreateQuizRequestDTO) {
        const model = await this.quizModel.create(record);
        return {
            id: model._id,
        }
    }

    @UsePipes(ValidationPipe)
    @Post('add-questions/:quizId')
    async addQuestions(@Param('quizId') quizId: string, @Body() record: AddQuestionsRequestDTO) {
        const model = await this.quizModel.findById(quizId);
        if (!model) throw new NotFoundException(`Quiz with id ${quizId} not found`);
        const questionIds = record.questions.map(({ id }) => id);
        const uniqueQuestionIds = new Set(questionIds);
        if (questionIds.length != uniqueQuestionIds.size) {
            throw new BadRequestException(`Duplicate question IDs in the request`);
        }
        model.questions = record.questions;
        await model.save();
        return {
            added: true,
        };
    }
}