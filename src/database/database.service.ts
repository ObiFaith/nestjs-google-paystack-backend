import { DataSource } from 'typeorm';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    if (this.dataSource.isInitialized) {
      this.logger.log('Database already initialized.');
    } else {
      try {
        await this.dataSource.initialize();
        this.logger.log('Database connected successfully!');
      } catch (error) {
        this.logger.error('Database connection failed', error);
      }
    }
  }
}
