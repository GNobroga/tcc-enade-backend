import { Module, OnModuleInit } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Quiz, QuizSchema } from "./schemas/quiz.schema";
import QuizController from "./quiz.controller";
import QuizSeedData from "./seed/quiz-seed-data";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Quiz.name, schema: QuizSchema }
        ])
    ],
    controllers: [QuizController],
    providers: [QuizSeedData],
})
export default class QuizModule implements OnModuleInit {

    constructor(readonly quizSeedData: QuizSeedData) {}

    onModuleInit() {
        this.quizSeedData.populate();
    }
}