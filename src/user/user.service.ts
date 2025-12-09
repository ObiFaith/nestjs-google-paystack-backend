import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Find user by Google ID (sub)
   */
  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { google_id: googleId } });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  /**
   * Create a new user
   */
  async createUser(dto: CreateUserDto): Promise<User> {
    const user = this.userRepo.create({
      email: dto.email,
      name: dto.name,
      password: dto.password ?? null,
      google_id: dto.google_id ?? null,
      picture: dto.picture ?? null,
      email_verified: dto.email_verified ?? false,
      last_login_at: new Date(),
    });

    return await this.userRepo.save(user);
  }

  /**
   * findOrCreateGoogleUser
   */
  async findOrCreateGoogleUser(profile: {
    sub: string;
    email: string;
    name: string;
    picture?: string;
    email_verified?: boolean;
  }): Promise<{ user: User; isNewUser: boolean }> {
    // Find user by Google ID or email
    let user =
      (await this.findByGoogleId(profile.sub)) ||
      (await this.findByEmail(profile.email));

    let isNewUser = false;

    // create new user
    if (!user) {
      user = await this.createUser({
        google_id: profile.sub,
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
        email_verified: profile.email_verified,
      });
      isNewUser = true;
    } else {
      // update last login timestamp
      user.last_login_at = new Date();
      await this.userRepo.save(user);
    }

    return { user, isNewUser };
  }
}
