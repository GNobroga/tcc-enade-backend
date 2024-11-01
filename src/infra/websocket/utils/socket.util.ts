import { Logger, UnauthorizedException } from "@nestjs/common";
import { Socket } from "socket.io";
import firebaseAdmin from "firebase-admin";

export abstract class SocketUtil {

    
    static async extractTokenFromSocketAndVerify(socket: Socket) {
       try {
            const token = socket.handshake.auth.token;
            if (!token) {
                throw new UnauthorizedException('Token is required');
            }
            const decodedToken = await this.verifyFirebaseToken(token);
            socket.user = await firebaseAdmin.auth().getUser(decodedToken.uid);
            return decodedToken;
       } catch (err) {
            Logger.error('Error while verifying token in socket', err);
            socket.disconnect(true);
       }
    }

    private static async verifyFirebaseToken(token: string) {
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