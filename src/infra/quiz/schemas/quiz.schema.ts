import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";


export type Asking = {
    title: string;
    body?: string[];
    footer?: string;
};

@Schema({ collection: 'alternatives' })
class Alternative {

    @Prop({ required: true })
    id: number;

    @Prop({ required: true })
    label: string;
}

@Schema({ collection: 'questions', id: true })
export class Question {

    _id?: string;

    @Prop({ required: false })
    title: string;

    @Prop({ required: false })
    content: string;

    @Prop({ type: [String] })
    photos?: string[];

    @Prop({ type: Object })
    asking?: Asking;

    @Prop()
    subAsking: string;

    @Prop({ type: [Alternative], _id: false })
    alternatives: Alternative[];

    @Prop({ required: true })
    correctId: number;

    @Prop({ required: true })
    category: string;

    @Prop({ required: true, default: 'easy' })
    difficulty: 'easy' | 'medium' | 'hard';
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

@Schema({ collection: 'quizzes' })
export class Quiz {

    @Prop({ required: true })
    year: number; 

    @Prop({ type: [QuestionSchema], default: [] })
    questions: Question[];

    timeSpent: [number, number, number];

    completed: boolean;
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);
