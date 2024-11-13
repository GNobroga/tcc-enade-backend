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
        const userStats = await this.userStatsModel
            .find()
            .sort({ score: -1, createdAt: 1 })
            .limit(20)
            .select('ownerId score'); 

     
        const ownerIds = userStats.map(stat => stat.ownerId);


        const firebaseUsers = await firebaseAdmin.auth().getUsers(
            ownerIds.map(id => ({ uid: id }))
        );

   
        const usersMap = firebaseUsers.users.reduce((map, user) => {
            map[user.uid] = user;
            return map;
        }, {} as Record<string, firebaseAdmin.auth.UserRecord>);


        const result = userStats
            .map(({ ownerId, score }) => {
                const user = usersMap[ownerId];
                if (!user) return null;
                return {
                    userId: user.uid,
                    name: user.displayName || 'Usuário sem nome',
                    photoUrl: user.photoURL || '',
                    score,
                };
            })
            .filter((user) => user !== null);  

        return result;
    }


}