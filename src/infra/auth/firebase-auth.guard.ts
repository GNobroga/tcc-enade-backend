import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import * as firebaseAdmin from 'firebase-admin';
import UserDetails from './user-details';

@Injectable()
export default class FirebaseAuthGuard implements CanActivate {

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractToken(request);

        try {
            const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
            request['user'] = new UserDetails(decodedToken.uid, decodedToken.email);
            return true;
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }

    private extractToken(request: Request): string {
        const authorization = request.headers['authorization'];
        if (authorization && authorization.startsWith('Bearer ')) {
            return authorization.replace('Bearer ', '');
        }
        throw new UnauthorizedException('Token is required');
    }
}
