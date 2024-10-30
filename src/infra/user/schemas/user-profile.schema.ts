import { Prop, Schema } from "@nestjs/mongoose";

@Schema({ collection: 'user_profile'})
export class UserProfile {

    @Prop()
    userId: string;

    
}