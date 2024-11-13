import { Controller, Get, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import firebaseAdmin from 'firebase-admin';
import { Model } from "mongoose";
import { UserStats } from "../schemas/user-stats.schema";


// @UseGuards(FirebaseAuthGuard)
@Controller({
    path: 'ranking',
    version: '1',
})
export default class RankingController {

    readonly logger = new Logger(RankingController.name);

    constructor(
        @InjectModel(UserStats.name) readonly userStatsModel: Model<UserStats>,
    ) {}

    @Get() 
    async listUserRanking() {
        const userStats = await this.userStatsModel.find()
            .sort({ score: -1, createdAt: 1 }).limit(100);

        const auth = firebaseAdmin.auth();

        const userStatsPromises = userStats.map(async ({ ownerId, score }) => {
            try {
                const user = await auth.getUser(ownerId);
                const { displayName, photoURL }  = user;
                return {
                    userId: ownerId,
                    name: displayName,
                    photoUrl: photoURL,
                    score
                }
            } catch {
                return null;
            }
        });
        const results = await Promise.all(userStatsPromises);
        return results.filter(result => result !== null);
    }


}