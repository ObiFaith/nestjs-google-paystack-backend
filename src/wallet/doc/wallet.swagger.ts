import {
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiParam,
  ApiHeader,
} from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';
import { applyDecorators } from '@nestjs/common';

export const WalletDepositSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Initiate Wallet Deposit (Paystack)' }),
    ApiBody({
      schema: {
        example: { amount: 5000 },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Deposit initialized successfully',
      schema: {
        example: {
          statusCode: 201,
          message: 'Deposit initialized',
          data: {
            authorization_url: 'https://paystack.com/pay/xxxx',
            reference: 'PSK_ref_xxxx',
          },
        },
      },
    }),
  );

export const WalletWebhookSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Paystack Webhook Callback' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Webhook received successfully',
      schema: {
        example: { received: true },
      },
    }),
  );

export const WalletStatusSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Check deposit transaction status' }),
    ApiParam({ name: 'reference', required: true }),
    ApiResponse({
      status: HttpStatus.OK,
      schema: {
        example: {
          statusCode: 200,
          message: 'Transaction status retrieved',
          data: {
            reference: 'xxxx',
            status: 'success',
            amount: 5000,
          },
        },
      },
    }),
  );

export const WalletBalanceSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get wallet balance' }),
    ApiResponse({
      status: HttpStatus.OK,
      schema: {
        example: {
          statusCode: 200,
          message: 'Wallet balance retrieved',
          data: { balance: 12000 },
        },
      },
    }),
  );

export const WalletTransferSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Transfer funds to another wallet' }),
    ApiBody({
      schema: {
        example: {
          wallet_number: 'WAL123456',
          amount: 2000,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      schema: {
        example: {
          statusCode: 201,
          message: 'Transfer successful',
          data: {
            from: 'user@example.com',
            to: 'recipient@example.com',
            amount: 2000,
            reference: 'TRX_12345',
          },
        },
      },
    }),
  );

export const WalletTransactionsSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get wallet transaction history' }),
    ApiResponse({
      status: HttpStatus.OK,
      schema: {
        example: {
          statusCode: 200,
          message: 'Transaction history fetched',
          data: [
            {
              id: 1,
              type: 'deposit',
              amount: 5000,
              status: 'success',
              created_at: '2025-01-01T10:00:00Z',
            },
          ],
        },
      },
    }),
  );
