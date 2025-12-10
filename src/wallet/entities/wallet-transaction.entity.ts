import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Wallet } from './wallet.entity';

@Entity('wallet_transactions')
export class WalletTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.transactions)
  wallet: Wallet;

  @Column()
  type: 'deposit' | 'transfer';

  @Column({ type: 'bigint' })
  amount: number;

  @Column()
  reference: string;

  @Column()
  status: 'success' | 'failed' | 'pending';

  @CreateDateColumn()
  createdAt: Date;
}
