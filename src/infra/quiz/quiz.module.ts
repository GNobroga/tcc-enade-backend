import { Module, OnModuleInit } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Quiz, QuizSchema } from "./schemas/quiz.schema";
import QuizController from "./quiz.controller";
import QuizSeedData from "./seeds/quiz-seed-data";
import { QuizCompletion, QuizCompletionSchema } from "./schemas/quiz-completion.schema";
import { UserModule } from "../user/user.module";
import { QuizHistory, QuizHistorySchema } from "./schemas/quiz-history.schema";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Quiz.name, schema: QuizSchema },
            { name: QuizCompletion.name, schema: QuizCompletionSchema },
            { name: QuizHistory.name, schema: QuizHistorySchema },
        ]),
        UserModule,
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