import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: true,
})
export class User extends Document {
  @Prop({ required: true, unique: true })
  google_id: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  picture: string;

  @Prop({ default: false })
  email_verified: boolean;

  @Prop({ type: Date, default: null })
  last_login_at: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
