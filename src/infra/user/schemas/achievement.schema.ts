import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'achievements', timestamps: true })
export class Achievement extends Document {

    @Prop({ required: true })  
    header: string;

    @Prop({ required: true }) 
    detail: string;

    @Prop({ required: true })  
    imageUrl: string;

    createdAt: Date;
}

export const AchievementSchema = SchemaFactory.createForClass(Achievement);
