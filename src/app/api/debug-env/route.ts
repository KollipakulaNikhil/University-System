import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        DB_HOST: process.env.DB_HOST,
        DB_USER: process.env.DB_USER,
        DB_PORT: process.env.DB_PORT,
        DB_NAME: process.env.DB_NAME,
        DB_SSL: process.env.DB_SSL,
        NODE_ENV: process.env.NODE_ENV,
    });
}
