import { exec } from 'child_process';
import { promisify } from 'util';
import { Client } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs'

const execAsync = promisify(exec);

dotenv.config({ path: '.env.test' });

export default async function globalSetup() {
    const dbUrl = process.env.DATABASE_URL!;
    console.log('dbUrl ' + dbUrl);

    const host = process.env.DB_HOST!;
    const port = process.env.DB_PORT!;
    const user = process.env.DB_USER!;
    const password = process.env.DB_PASSWORD!;

    const test_db = process.env.TEST_DB!;
    const management_db = process.env.MANAGEMENT_DB_NAME!;

    console.log('host ' + host);
    console.log('port ' + port);
    console.log('user ' + user);
    console.log('password ' + password);

    console.log('test_db ' + test_db);
    console.log('management_db ' + management_db);

    const client = new Client({
        host,
        port: parseInt(port),
        database : management_db,
        user,
        password,
    })

    try {
        await client.connect();

        await client.query(`DROP DATABASE IF EXISTS ${test_db}`);

        await client.query(`CREATE DATABASE ${test_db}`);

        await client.end();

        const createTablesScript = `
import sys
import os
sys.path.insert(0, "backend")

# Set the test database URL
os.environ["DATABASE_URL"] = "${dbUrl}"

from app.database import engine
from app.models import *
from sqlmodel import SQLModel

def create_tables():
    SQLModel.metadata.create_all(engine)
    print("✅ Tables created successfully!")

create_tables()
`;

        const tempScriptPath = '/tmp/create_tables.py';
        fs.writeFileSync(tempScriptPath, createTablesScript);

        const { stdout: createOutput } = await execAsync(
            `python ${tempScriptPath}`,
            { env: { ...process.env, DATABASE_URL: dbUrl } }
        );
        console.log('createOutput ' + createOutput);

        fs.unlinkSync(tempScriptPath);
        console.log('created tables successfully!\n');

        const seedScript = `
        import sys
import os
sys.path.insert(0, "backend")

os.environ["DATABASE_URL"] = "${dbUrl}"

try:
    from seeds import seed_all
    print("Found seeds.seed_all()")
    seed_all()
    print("✅ Seeding complete!")
except ImportError:
    try:
        from seeds import main
        print("Found seeds.main()")
        main()
        print("✅ Seeding complete!")
    except ImportError as e:
        print(f"⚠️  No seed function found: {e}")
        print("Skipping seed...")
        `

        const tempSeedScriptPath = '/tmp/seed_data.py';
        fs.writeFileSync(tempSeedScriptPath, seedScript);

        const { stdout: seedOutput } = await execAsync(
            `python ${tempSeedScriptPath}`,
            { env: { ...process.env, DATABASE_URL: dbUrl } }
        );
        console.log('seedOutput ' + seedOutput);

        fs.unlinkSync(tempSeedScriptPath);
        console.log('seeded tables successfully!\n');
    } catch (error) {
        console.log(error);
        throw error;
    }
}