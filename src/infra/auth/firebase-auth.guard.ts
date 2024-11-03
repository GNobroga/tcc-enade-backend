import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { HttpArgumentsHost, WsArgumentsHost } from '@nestjs/common/interfaces';
import { Request } from 'express';
import * as firebaseAdmin from 'firebase-admin';
import UserDetails from './user-details';
import { Socket } from 'socket.io';

@Injectable()
export default class FirebaseAuthGuard implements CanActivate {

    canActivate(context: ExecutionContext): Promise<boolean> {
        switch (context.getType()) {
            case 'http': 
                return this.handleHttpContext(context.switchToHttp());
            case 'ws':
                return this.handleWsContext(context.switchToWs());
            default:
                throw new UnauthorizedException('Context type not supported');
        }
    }

    private async handleWsContext(context: WsArgumentsHost): Promise<boolean> {
        const socket = context.getClient<Socket>();
        const token = socket.handshake.auth.token;
        if (!token) {
            throw new UnauthorizedException('Token is required for accessing WS resource.');
        }
        try {
            const decodedToken = await this.verifyFirebaseToken(token);
            socket['user'] = await firebaseAdmin.auth().getUser(decodedToken.uid);
            return true;
        } catch (error) {
            Logger.error('An error occurred while verifying token: ', error);
            throw new UnauthorizedException('Invalid or expired token');
        }
    }
    
    private async handleHttpContext(context: HttpArgumentsHost): Promise<boolean> {
        const request = context.getRequest<Request>();
        const token = this.extractTokenFromRequest(request);

        try {
            const decodedToken = await this.verifyFirebaseToken(token);
            request['user'] = new UserDetails(decodedToken.uid, decodedToken.email);
            return true;
        } catch (error) {
            Logger.error('An error occurred while verifying token: ', error);
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
