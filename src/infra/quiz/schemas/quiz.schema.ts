import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

// Definir tipos apenas como interfaces TypeScript
export type Alternative = {
    id: number;
    label: string;
};
  
export type Asking = {
    title: string;
    body?: string[];
    footer?: string;
};


@Schema({ collection: 'questions' })
export class Question {

    @Prop({ required: true, })
    id: number;

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    content: string;

    @Prop({ type: [String] })
    photos?: string[];

    @Prop({ type: Object })
    asking: Asking;

    @Prop({ type: Array })
    alternatives: Alternative[];

    @Prop({ required: true })
    correctId: number;

    @Prop({ type: String, required: true })
    category: string;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

@Schema({ collection: 'quizzes' })
export class Quiz extends Document {

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    year: number;

    @Prop({ type: [QuestionSchema], default: [] })
    questions: Question[];
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);
