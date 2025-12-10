import {
  Column,
  Entity,
  OneToOne,
  OneToMany,
  UpdateDateColumn,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Wallet } from '../../wallet/entities/wallet.entity';
import { ApiKey } from '../../api-key/entities/api-key.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  google_id: string | null;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  picture: string | null;

  @Column({ default: false })
  email_verified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string | null;

  @OneToMany(() => ApiKey, (apiKey) => apiKey.user, { cascade: true })
  apiKeys: ApiKey[];

  @OneToOne(() => Wallet, (wallet) => wallet.user)
  wallet: Wallet;

  @Column({ type: 'timestamp', nullable: true })
  last_login_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
