import { UnauthorizedException } from "@nestjs/common";
import { Socket } from "socket.io";
import firebaseAdmin from "firebase-admin";

export abstract class SocketUtil {

    
    static extractTokenFromSocket(socket: Socket): string {
        const token = socket.handshake.auth?.token;
        if (!token) {
            throw new UnauthorizedException('Token is required');
        }
        return token;
    }

    static async verifyFirebaseToken(token: string) {
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