import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ collection: 'quiz_history', timestamps: true })
export class QuizHistory {

    @Prop()
    userId: string;

    @Prop()
    quizId: string;

    @Prop()
    totalQuestions: number;

    @Prop()
    correctAnswers: number;  

    @Prop()
    incorrectAnswers: number;  

    @Prop()
    startTime: [number, number, number];

    @Prop()
    timeSpent: [number, number, number];
    
    @Prop()
    score: number;

    createdAt?: Date;
}

export const QuizHistorySchema = SchemaFactory.createForClass(QuizHistory);