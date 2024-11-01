import { BadRequestException, Controller, Get, Param, UseGuards } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import FirebaseAuthGuard from "src/infra/auth/firebase-auth.guard";
import { CurrentUser } from "src/infra/auth/user-details.decorator";
import { UserFriend } from "../schemas/user-friend.schema";

@UseGuards(FirebaseAuthGuard)
@Controller({ path: 'user-friend', version: '1'})
export default class UserFriendController {

    constructor(
        @InjectModel(UserFriend.name) readonly userFriendModel: Model<UserFriend>
    ) {}

    @Get("send-request/:id")
    async sendFriendRequest(@CurrentUser('uid') userId: string, @Param('id') friendId: string) {
        const existingFriendship = await this.userFriendModel.findOne({
            userId,
            friendId,
            requestedBy: userId,
        });

        if (userId === friendId) {
            throw new BadRequestException('Friend request cannot be sending to yourself');
        }
    
        if (existingFriendship) {
            if (existingFriendship.status === 'accepted') {
                throw new BadRequestException('Friendship already exists and is accepted');
            } else {
                throw new BadRequestException('Friend request is already pending');
            }
        }
    
        await this.userFriendModel.create({
            userId,
            friendId,
            requestedBy: userId,
            status: 'pending',  
        });
    
        return {
            success: true,
            message: 'Friend request sent successfully',
        };
    }
}