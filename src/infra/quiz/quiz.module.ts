import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Quiz, QuizSchema } from "./schemas/quiz.schema";
import QuizController from "./quiz.controller";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Quiz.name, schema: QuizSchema }
        ])
    ],
    controllers: [QuizController],
})
export default class QuizModule {}