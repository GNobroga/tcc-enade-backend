import { Controller, Get, Logger, UseGuards } from "@nestjs/common";
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

    readonly logger = new Logger(RankingController.name);

    constructor(
        @InjectModel(UserStats.name) readonly userStatsModel: Model<UserStats>,
    ) {}

    @Get() 
    async listUserRanking() {
        const userStats = await this.userStatsModel.find()
            .sort({ score: -1, createdAt: 1 }).limit(20);

   
        const ownerIds = userStats.map(({ ownerId }) => ownerId);
        
        const batchedOwnerIds = [];
        for (let i = 0; i < ownerIds.length; i += 100) {
            batchedOwnerIds.push(ownerIds.slice(i, i + 100));
        }

        const userData: { [key: string]: { displayName: string; photoURL: string } } = {};

        for (const batch of batchedOwnerIds) {
            try {
                const users = await firebaseAdmin.auth().getUsers(
                    batch.map(uid => ({ uid }))
                );
                
                users.users.forEach(user => {
                    userData[user.uid] = {
                        displayName: user.displayName || 'Usuário sem nome',
                        photoURL: user.photoURL || 'url_default_imagem'
                    };
                });
            } catch (error) {
                this.logger.error('Erro ao buscar usuários no Firebase', error);
            }
        }

        const result = userStats.map(({ ownerId, score }) => {
            const user = userData[ownerId];
            return user ? {
                userId: ownerId,
                name: user.displayName,
                photoUrl: user.photoURL,
                score
            } : null;
        }).filter(obj => obj !== null);

        return result;
    }


}