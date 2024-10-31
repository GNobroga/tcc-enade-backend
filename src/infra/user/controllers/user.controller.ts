import { Controller, Get, UseGuards } from '@nestjs/common';
import UserService from '../services/user.service';
import { CurrentUser } from 'src/infra/auth/user-details.decorator';
import FirebaseAuthGuard from 'src/infra/auth/firebase-auth.guard';

@UseGuards(FirebaseAuthGuard)
@Controller({ path: 'users', version: '1', })
export class UserController {

    constructor(
        readonly service: UserService
    ) {}

    @Get('initialize-progress')
    initializeUserProgress(@CurrentUser('uid') id: string) {
        this.service.initializeUserProgress(id);
    }

}
