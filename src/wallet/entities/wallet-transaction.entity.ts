import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Wallet } from './wallet.entity';

@Entity('wallet_transactions')
export class WalletTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.transactions)
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;

  @Column()
  wallet_id: string;

  @Column()
  type: 'deposit' | 'transfer';

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column()
  reference: string;

  @Column()
  status: 'success' | 'failed' | 'pending';

  @CreateDateColumn()
  created_at: Date;
}
