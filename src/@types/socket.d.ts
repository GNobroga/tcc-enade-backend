import { UserRecord } from "firebase-admin/lib/auth/user-record";

declare module "socket.io" {
    interface Socket {
        user: UserRecord;
    }
}