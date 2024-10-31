import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { Request } from 'express';
import * as firebaseAdmin from 'firebase-admin';
import UserDetails from './user-details';

@Injectable()
export default class FirebaseAuthGuard implements CanActivate {

    async canActivate(context: ExecutionContext): Promise<boolean> {
        return await this.handleHttpContext(context.switchToHttp());
    }
    
    private async handleHttpContext(context: HttpArgumentsHost): Promise<boolean> {
        const request = context.getRequest<Request>();
        const token = this.extractTokenFromRequest(request);

        try {
            const decodedToken = await this.verifyFirebaseToken(token);
            request['user'] = new UserDetails(decodedToken.uid, decodedToken.email);
            return true;
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }
    
    private extractTokenFromRequest(request: Request): string {
        const authorization = request.headers['authorization'];
        if (authorization && authorization.startsWith('Bearer ')) {
            return authorization.replace('Bearer ', '');
        }
        throw new UnauthorizedException('Token is required');
    }

    private async verifyFirebaseToken(token: string) {
        if (!token) {
            throw new UnauthorizedException('Token is required');
        }
        try {
            return await firebaseAdmin.auth().verifyIdToken(token);
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }
}
