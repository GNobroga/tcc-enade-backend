import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import UserDetails from './user-details';

export const CurrentUser = createParamDecorator((data: string | null, context: ExecutionContext) => {
  const contextType = context.getType();

  let user: UserDetails;

  if (contextType === 'http') {
    const request = context.switchToHttp().getRequest();
    user = request.user;
  } else if (contextType === 'ws') {
    const client = context.switchToWs().getClient();
    user = client.handshake.user;
  } else {
    throw new UnauthorizedException('Unsupported request context');
  }

  if (!user) {
    throw new UnauthorizedException('User not found in request');
  }

  return data ? user[data] : user;
});
