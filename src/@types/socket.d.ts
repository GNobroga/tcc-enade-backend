import UserDetails from "src/infra/auth/user-details";

declare module "socket.io" {
    interface Socket {
        user: UserDetails;
    }
}