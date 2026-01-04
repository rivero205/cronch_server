const sql = require('../db');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
    try {
        console.log('Reading schema file...');
        const schemaPath = path.join(__dirname, 'schema_pg.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing schema as a single transaction...');

        // Execute the entire schema as one statement
        await sql.unsafe(schema);

        console.log('✅ Database schema created successfully!');

        // Verify tables
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `;

        console.log('\n📋 Created tables:');
        tables.forEach(t => console.log(`  - ${t.table_name}`));

        await sql.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error setting up database:', error.message);
        console.error(error);
        await sql.end();
        process.exit(1);
    }
}

setupDatabase();
