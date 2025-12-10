import { Controller, Get, Res } from '@nestjs/common';
import express from 'express';

@Controller()
export class AppController {
  @Get()
  home(@Res() res: express.Response) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Wallet Service with Paystack, JWT & API Keys</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: #f5f5f5;
            padding: 40px;
            text-align: center;
          }
          h1 {
            color: #333;
          }
          a {
            display: inline-block;
            margin-top: 20px;
            font-weight: 500;
            padding: 12px 24px;
            background: #5ec009ff;
            color: white;
            font-size: 16px;
            text-decoration: none;
            border-radius: 6px;
          }
          a:hover {
            background: #3a7904ff;
          }
        </style>
      </head>
      <body>
        <h1>Wallet Service with Paystack, JWT & API Keys</h1>
        <a href="/docs">API Documentation</a>
      </body>
      </html>
    `;
    res.type('html').send(html);
  }
}
