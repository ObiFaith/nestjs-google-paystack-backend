import { Model } from 'mongoose';
import { User } from './entities/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  /**
   * Find user by Google ID (sub)
   */
  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.userModel.findOne({ google_id: googleId }).exec();
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  /**
   * Create user from Google profile
   */
  async createFromGoogle(profile: {
    google_id: string;
    email: string;
    name: string;
    picture?: string;
    email_verified?: boolean;
  }): Promise<User> {
    const newUser = new this.userModel({
      google_id: profile.google_id,
      email: profile.email,
      name: profile.name,
      picture: profile.picture ?? null,
      email_verified: profile.email_verified ?? false,
      last_login_at: new Date(),
    });

    return newUser.save();
  }

  /**
   * findOrCreateGoogleUser
   * - Check Google ID
   * - Check email (fallback)
   * - Create if not exists
   * - Update last_login_at
   */
  async findOrCreateGoogleUser(profile: {
    sub: string;
    email: string;
    name: string;
    picture?: string;
    email_verified?: boolean;
  }): Promise<{ user: User; isNewUser: boolean }> {
    const google_id = profile.sub;

    // Find user by google_id
    let user = await this.findByGoogleId(google_id);

    // Find user by email
    if (!user) {
      user = await this.findByEmail(profile.email);
    }

    let isNewUser = false;

    // 3. Create new user if none exists
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

    // 4. Update login timestamp
    user.last_login_at = new Date();
    await user.save();

    return { user, isNewUser };
  }
}
