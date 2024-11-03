import { BadRequestException, Controller, Get, HttpCode, HttpStatus, NotFoundException, Param, UseGuards } from "@nestjs/common";
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

    @Get('remove-friend/:friendId')
    async removeFriend(@CurrentUser('uid') userId: string, @Param('friendId') friendId: string) {
        const userFriend = await this.userFriendModel.findOne({
            $or: [
                { requestedBy: userId },
                { requestedBy: friendId },
            ],
            status: 'accepted',
        });

        if (!userFriend) return { removed: false };


        await this.userFriendModel.findByIdAndDelete(userFriend._id.toString(), { new: true, });

        return { removed: true };
    }

    @Get('accept-request/:requestId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async acceptRequest(@Param('requestId') requestId: string) {
        const existingFriendship = await this.userFriendModel.findById(requestId);

        if (!existingFriendship) {
            throw new NotFoundException('User friend request not found');
        }

        existingFriendship.status = 'accepted';
        await existingFriendship.save();
    }

    @Get('reject-request/:requestId')
    async rejectRequest(@Param('requestId') requestId: string) {
        const existingFriendship = await this.userFriendModel.findById(requestId);
        if (!existingFriendship) {
            throw new NotFoundException('User friend request not found');
        }
        if (existingFriendship.status === 'accepted') {
            throw new BadRequestException('User friend request already accepted');
        }
        await this.userFriendModel.findByIdAndDelete(requestId, { new: true, });
        return {
            deleted: true,
        };
    }

    @Get("send-request/:id")
    async sendFriendRequest(@CurrentUser('uid') userId: string, @Param('id') friendId: string) {
        const existingFriendship = await this.userFriendModel.findOne({
            $or: [
                { requestedBy: userId },
                { requestedBy: friendId },
            ]
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

    @Get('/check-if-they-friends/:friendId')
    async checkIfTheyFriends(@CurrentUser('uid') ownerId: string, @Param('friendId') friendId: string) {
        const existingFriendship = await this.userFriendModel.findOne({
            $or: [
                { requestedBy: ownerId },
                { requestedBy: friendId },
            ],
            status: 'accepted',
        });
        return {
            friend: existingFriendship != null,
        };
    }
}