import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ collection: 'user_achievements', timestamps: true })
export class UserAchievement {

    @Prop()  
    userId: string;

    @Prop({ type: Types.ObjectId, ref: 'Achievement', required: true })  
    achievementId: Types.ObjectId;
}

export const UserAchievementSchema = SchemaFactory.createForClass(UserAchievement);
