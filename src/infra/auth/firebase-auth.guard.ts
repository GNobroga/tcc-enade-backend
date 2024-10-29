import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { HttpArgumentsHost, WsArgumentsHost } from '@nestjs/common/interfaces';
import { Request } from 'express';
import * as firebaseAdmin from 'firebase-admin';
import { Socket } from 'socket.io';
import UserDetails from './user-details';

@Injectable()
export default class FirebaseAuthGuard implements CanActivate {

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const contextType = context.getType();
    console.log('oi')
    switch (contextType) {
      case 'http': 
        return await this.handleHttpContext(context.switchToHttp());
      case 'ws':
        return await this.handleWebSocketContext(context.switchToWs());
      default:
        throw new UnauthorizedException('Unsupported request type');
    }
  }

  private async handleWebSocketContext(context: WsArgumentsHost): Promise<boolean> {
    const socket = context.getClient<Socket>();
    const token = this.extractTokenFromSocket(socket);

    try {
      const decodedToken = await this.verifyFirebaseToken(token);
      socket['user'] = new UserDetails(decodedToken.uid, decodedToken.email);
      return true;
    } catch (error) {
      socket.disconnect(); 
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
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromSocket(socket: Socket): string {
    const token = socket.handshake.auth?.token;
    if (!token) {
      throw new UnauthorizedException('Token is required');
    }
    return token;
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
