import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Public, AuthUser } from '@common';
import type { CurrentUser } from '@common';
import { UserEntity } from '../users/entities/user.entity';
import { SessionEntity } from './entities/session.entity';
import { AuthService } from './auth.service';
import { RegisterUserInput } from './dto/register-user.input';
import {
  createMessageResponse,
  IMessageMutationResponse,
} from '@common/dto/mutation-response.type';

// 1. Instantiate your unique class type ONCE at the file level
const ChangePasswordResponse = createMessageResponse('ChangePasswordResponse');
@Resolver(() => UserEntity)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Mutation(() => UserEntity)
  registerUser(
    @Args('registerUserInput') registerUserInput: RegisterUserInput,
  ) {
    return this.authService.registerUser(registerUserInput);
  }

  @Public()
  @Mutation(() => UserEntity)
  verifyEmail(@Args('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Public()
  @Mutation(() => Boolean)
  async forgotPassword(@Args('email') email: string): Promise<boolean> {
    await this.authService.forgotPassword(email);
    return true;
  }

  @Public()
  @Mutation(() => Boolean)
  async resetPassword(
    @Args('token') token: string,
    @Args('password') password: string,
  ): Promise<boolean> {
    await this.authService.resetPassword(token, password);
    return true;
  }

  @Public()
  @Mutation(() => Boolean)
  async resendVerification(@Args('email') email: string): Promise<boolean> {
    await this.authService.resendVerification(email);
    return true;
  }

  @Mutation(() => ChangePasswordResponse)
  async changePassword(
    @AuthUser() user: CurrentUser,
    @Args('currentPassword') currentPassword: string,
    @Args('newPassword') newPassword: string,
  ): Promise<IMessageMutationResponse> {
    await this.authService.changePassword(
      user.uniqueId,
      currentPassword,
      newPassword,
    );
    return { message: 'success.UPDATE_PASSWORD' };
  }

  @Query(() => [SessionEntity])
  mySessions(@AuthUser() user: CurrentUser) {
    return this.authService.getSessions(user.id);
  }

  @Mutation(() => Boolean)
  async revokeSession(
    @AuthUser() user: CurrentUser,
    @Args('uniqueId') uniqueId: string,
  ): Promise<boolean> {
    await this.authService.revokeSession(user.id, uniqueId);
    return true;
  }
}
