import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ collection: 'quiz_completion', timestamps: true, })
export class QuizCompletion {

    @Prop({ required: true, })
    userId: string;

    @Prop({ required: true, })
    quizId: string;

    @Prop({ required: true, })
    category: string;

    @Prop({ required: true, default: false })
    completed: boolean;

    @Prop({ type: Array, default: [0, 0, 0]})
    timeSpent: [number, number, number];

    @Prop({ type: [String], default: [] })
    correctQuestionIds: string[];
}

export const QuizCompletionSchema = SchemaFactory.createForClass(QuizCompletion);