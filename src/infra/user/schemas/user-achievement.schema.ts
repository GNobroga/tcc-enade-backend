import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'user_achievements', timestamps: true })
export class UserAchievement extends Document {

    @Prop()  
    userId: string;

    @Prop({ type: Types.ObjectId, ref: 'Achievement', required: true })  
    achievementId: Types.ObjectId;

    @Prop({ default: 'in-progress' })  
    status: 'in-progress' | 'completed';

    @Prop()  
    completedAt?: Date;
}

export const UserAchievementSchema = SchemaFactory.createForClass(UserAchievement);
