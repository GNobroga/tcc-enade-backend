import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type Goal = {
    description: string;
    count: number;
};

export enum AchievementType {
    SOCIAL = 'social',
    LEARNING = 'learning',
    RANKING = 'ranking',
}

@Schema({ collection: 'achievements', timestamps: true })
export class Achievement {

    @Prop({ required: true })  
    header: string;

    @Prop({ required: true }) 
    detail: string;

    @Prop({ required: true })  
    imageUrl: string;

    @Prop({ enum: AchievementType })
    type: AchievementType;

    @Prop({ type: { description: String, count: Number }, _id: false})
    goal: Goal;

    createdAt: Date;
}

export const AchievementSchema = SchemaFactory.createForClass(Achievement)

