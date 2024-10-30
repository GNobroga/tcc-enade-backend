import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
    collection: 'user_friends',
    timestamps: true 
})
export class UserFriend extends Document {

    @Prop({ required: true })
    userId: string;

    @Prop({ required: true })
    friendId: string;

    @Prop({ 
        type: String, 
        enum: ['pending', 'accepted', 'rejected'], 
        default: 'pending' 
    })
    status: 'pending' | 'accepted' | 'rejected';

    @Prop({ required: true })
    requestedBy: string; 
}

export const UserFriendSchema = SchemaFactory.createForClass(UserFriend);
