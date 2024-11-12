import { Controller, Get, UseGuards } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { UserStats } from "../schemas/user-stats.schema";
import { Model } from "mongoose";
import firebaseAdmin from 'firebase-admin';
import FirebaseAuthGuard from "src/infra/auth/firebase-auth.guard";


@UseGuards(FirebaseAuthGuard)
@Controller({
    path: 'ranking',
    version: '1',
})
export default class RankingController {

    constructor(
        @InjectModel(UserStats.name) readonly userStatsModel: Model<UserStats>,
    ) {}

    @Get() 
    async listUserRanking() {
        const userStats = await this.userStatsModel.find()
            .sort({ score: -1, createdAt: 1 }).limit(20);

        const result = await Promise.all(userStats.map(async ({ ownerId, score })=> {
            const user = await firebaseAdmin.auth().getUser(ownerId);
            if (!user) return null;
            return {
                userId: user.uid,
                name: user.displayName,
                photoUrl: user.photoURL,
                score
            }
        }));

        const filteredResult = result.filter(obj => obj !== null);

        return filteredResult;
    }

}