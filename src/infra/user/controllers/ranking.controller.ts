import { Controller, Get } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { UserStats } from "../schemas/user-stats.schema";
import { Model } from "mongoose";
import firebaseAdmin from 'firebase-admin';

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
            .sort({ score: -1 });

        return userStats;
    }

}