const sql = require('../db');

async function testConnection() {
    try {
        console.log('Testing Supabase connection...');
        console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'NOT SET');

        // Simple query to test connection
        const result = await sql`SELECT NOW() as current_time, version() as pg_version`;

        console.log('✅ Connection successful!');
        console.log('Current time:', result[0].current_time);
        console.log('PostgreSQL version:', result[0].pg_version);

        await sql.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Connection failed!');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Full error:', error);
        process.exit(1);
    }
}

testConnection();
