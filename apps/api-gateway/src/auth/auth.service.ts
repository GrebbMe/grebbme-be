import { ForbiddenException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'jsonwebtoken';
import { firstValueFrom } from 'rxjs';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { Payload } from './types/jwt.type';
import { GithubUser } from './types/user.type';

type LoginReturn = Partial<GithubUser> & {
  access_token?: string;
  refresh_token?: string;
  isExist: boolean;
};

@Injectable()
export class AuthService {
  public constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  public async login(user: GithubUser): Promise<LoginReturn> {
    const { email, githubId, name } = user;

    const existUser = await firstValueFrom(await this.userService.loginOrCreateUser(email, name));

    if (existUser.data.isExist === false) {
      // * 유저가 존재하지 않을경우 회원 가입 처리를 위해 최소 데이터만 반환
      return {
        email: existUser.data.email,
        githubId,
        name: existUser.data.nickname,
        isExist: false,
      };
    }

    const paylaod: JwtPayload = { email, sub: githubId };

    return {
      access_token: this.jwtService.sign(paylaod, this.configService.get('jwt.accessSignOptions')),
      refresh_token: this.jwtService.sign(paylaod, {
        ...this.configService.get('jwt.refreshSignOptions'),
        secret: this.configService.get('jwt.secret'),
      }),
      ...existUser.data,
    };
  }

  public async refreshAccessToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('jwt.secret'),
      });
      const user = await firstValueFrom(await this.validateUser(payload.email));

      if (user.status === HttpStatus.OK) {
        return this.generateAccessToken(payload);
      }
    } catch {
      return null;
    }
  }

  public generateRefreshToken(payload: Payload | User) {
    const token = this.jwtService.sign(
      { email: payload.email },
      {
        secret: this.configService.get('jwt.secret'),
        ...this.configService.get('jwt.refreshSignOptions'),
      },
    );

    return {
      refresh_token: token,
      path: '/',
      httpOnly: true,
    };
  }

  public async generateAccessToken(paylaod: Payload | User) {
    const token = this.jwtService.sign(
      { email: paylaod.email },
      {
        secret: this.configService.get('jwt.secret'),
        ...this.configService.get('jwt.accessSignOptions'),
      },
    );

    return {
      access_token: token,
      path: '/',
      httpOnly: true,
    };
  }

  public refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('jwt.secret'),
      });

      const newAccessToken = this.jwtService.sign(
        {
          email: payload.email,
          sub: payload.sub,
        },
        {
          ...this.configService.get('jwt.accessSignOptions'),
          secret: this.configService.get('jwt.secret'),
        },
      );

      return {
        access_token: newAccessToken,
      };
    } catch (error) {
      throw new ForbiddenException('올바른 토큰이 아닙니다.');
    }
  }

  public async validateUser(email: string) {
    return await this.userService.findUserByEmail(email);
  }
}
