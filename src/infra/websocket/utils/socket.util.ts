import { UnauthorizedException } from "@nestjs/common";
import firebaseAdmin from "firebase-admin";
import { Socket } from "socket.io";

export abstract class SocketUtil {

    static async verifyFirebaseToken(socket: Socket) {
        const token = socket.handshake.auth.token;
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