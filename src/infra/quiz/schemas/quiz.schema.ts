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

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    content: string;

    @Prop({ type: [String] })
    photos?: string[];

    @Prop({ type: Object })
    asking: Asking;

    @Prop({ type: [Alternative], _id: false })
    alternatives: Alternative[];

    @Prop({ required: true })
    correctId: number;

    @Prop({ required: true })
    category: string;

    @Prop({ type: Boolean, default: false })
    done: boolean;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

@Schema({ collection: 'quizzes', id: true })
export class Quiz {

    id: string;

    @Prop({ required: true })
    year: number;

    @Prop({ type: [QuestionSchema], default: [] })
    questions: Question[];

    @Prop({ type: Array, default: [0, 0, 0]})
    timeSpent: [number, number, number];

    @Prop({ type: Boolean, default: false })
    completed: boolean;
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);
