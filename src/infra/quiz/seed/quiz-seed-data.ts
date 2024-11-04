import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { resolve } from "path";
import { readFile } from "fs/promises";
import { Alternative, Question } from "../dtos/request/add-questions-request.dto";
import { Quiz } from "../schemas/quiz.schema";

@Injectable()
export default class QuizSeedData {
    constructor(
        @InjectModel(Quiz.name) readonly model: Model<Quiz>
    ) {}

    async populate() {
        try {
            await this.model.deleteMany();

            const json = await readFile(resolve('public', 'quizzes.json'), 'utf-8');
            const { questions } = JSON.parse(json) as { questions: (Question & { year: number })[] };
            
            const assignAlternativeId = (alternative: Alternative & { id: number }, index: number) => {
                alternative.id = index + 1;
            };

            for (const question of questions) {
                question.alternatives.forEach(assignAlternativeId);

                const correctId = question.correctId;
                if (!question.alternatives.some(a => a['id'] === correctId)) {
                    throw new Error(`A questão "${question.title}" não possui um correctId que corresponda a uma alternativa.`);
                }

                let quiz = await this.model.findOne({ year: question.year });

                if (!quiz) {
                    quiz = {
                        year: question.year,
                        questions: [question as any],
                    } as any;
                    await this.model.create(quiz);
                } else {
                    quiz.questions.push(question as any);
                    await quiz.save();
                }
            }
        } catch {
            console.log('Não foi possível popular dados');
        }
    }
}
