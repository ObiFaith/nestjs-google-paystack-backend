import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, Logger } from '@nestjs/common';

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
   * Create a new user from Google data
   */
  async createFromGoogle(profile: {
    google_id: string;
    email: string;
    name: string;
    picture?: string;
    email_verified?: boolean;
  }): Promise<User> {
    const user = this.userRepo.create({
      google_id: profile.google_id,
      email: profile.email,
      name: profile.name,
      picture: profile.picture ?? null,
      email_verified: profile.email_verified ?? false,
      last_login_at: new Date(),
    });

    return this.userRepo.save(user);
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
    const google_id = profile.sub;

    // Find user by Google ID
    let user = await this.findByGoogleId(google_id);

    // Find user by email
    if (!user) {
      user = await this.findByEmail(profile.email);
    }

    let isNewUser = false;

    // create new user
    if (!user) {
      user = await this.createFromGoogle({
        google_id,
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
        email_verified: profile.email_verified,
      });
      isNewUser = true;
    }

    // 4. Update last login timestamp
    user.last_login_at = new Date();
    await this.userRepo.save(user);

    return { user, isNewUser };
  }
}
