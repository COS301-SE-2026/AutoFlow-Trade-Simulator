import { exec } from 'child_process';
import { promisify } from 'util';
import { Client } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs'
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

dotenv.config({ path: '.env.test' });

const getVenvPython = () => {
    const venvPath = path.join(process.cwd(), '.venv');
    if (os.platform() === 'win32') {
        return path.join(venvPath, 'Scripts', 'python.exe');
    }
    return path.join(venvPath, 'bin', 'python');
};

const VENV_PYTHON = getVenvPython();
console.log('VENV_PYTHON ' + VENV_PYTHON);

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
        database: management_db,
        user,
        password,
    })

    try {
        await client.connect();

        await client.query(`
                SELECT pg_terminate_backend(pid)
                FROM pg_stat_activity
                WHERE datname = '${test_db}' AND pid <> pg_backend_pid();
                `);

        await client.query(`DROP DATABASE IF EXISTS ${test_db}`);

        await client.query(`CREATE DATABASE ${test_db}`);

        await client.end();

        // 1. creating tables

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
            `${VENV_PYTHON} ${tempScriptPath}`,
            { env: { ...process.env, DATABASE_URL: dbUrl } }
        );
        console.log('createOutput ' + createOutput);

        fs.unlinkSync(tempScriptPath);
        console.log('created tables successfully!\n');

        // 2. creating ohlcv view

        const createViewScript = `
import os
import sys
sys.path.insert(0, "backend")
from app.database import engine
from sqlmodel import Session, text

# Use SQLAlchemy to execute the CREATE VIEW command
with Session(engine) as session:
    session.execute(text("""
        CREATE MATERIALIZED VIEW IF NOT EXISTS ohlcv_1d AS
        SELECT 
            asset_id,
            timestamp AS bucket_time,
            open,
            high,
            low,
            close,
            volume
        FROM dailyohlcv
        ORDER BY asset_id, timestamp DESC;
    """))
    session.commit()
    print("✅ ohlcv_1d view created!")
    `;

        const tempViewScriptPath = '/tmp/create_view.py';
        fs.writeFileSync(tempViewScriptPath, createViewScript);

        const { stdout: viewOutput } = await execAsync(
            `${VENV_PYTHON} ${tempViewScriptPath}`,
            { env: { ...process.env, DATABASE_URL: dbUrl } }
        );
        console.log('viewOutput ' + viewOutput);

        fs.unlinkSync(tempViewScriptPath);
        console.log('views successfully!\n');

        // 3. refresh views
        const refreshViewScript = `
import sys
sys.path.insert(0, "backend")
from app.database import engine
from sqlmodel import Session, text

with Session(engine) as session:
    session.execute(text("REFRESH MATERIALIZED VIEW ohlcv_1d;"))
    session.commit()
    print("✅ ohlcv_1d view refreshed!")
    `;

        const refreshViewScriptPath = '/tmp/refresh_view.py';
        fs.writeFileSync(refreshViewScriptPath, refreshViewScript);

        const { stdout: refreshOutput } = await execAsync(
            `${VENV_PYTHON} ${refreshViewScriptPath}`,
            { env: { ...process.env, DATABASE_URL: dbUrl } }
        );
        console.log('refreshOutput ' + refreshOutput);

        fs.unlinkSync(refreshViewScriptPath);
        console.log('refreshed views successfully!\n');


        // 4. seeding tables
        const seedScript = `
import sys
import os
sys.path.insert(0, "backend")

os.environ["DATABASE_URL"] = "${dbUrl}"

try:
    from seeds import seed_data
    print("Found seeds.seed_data()")
    seed_data()
    print("✅ Seeding complete!")
except ImportError as e:
    print(f"⚠️  Could not import seed_data: {e}")
    print("Skipping seed...")
except Exception as e:
    print(f"⚠️  Seed execution failed: {e}")
    print("Skipping seed...")
`;

        const tempSeedScriptPath = '/tmp/seed_data.py';
        fs.writeFileSync(tempSeedScriptPath, seedScript);

        const { stdout: seedOutput } = await execAsync(
            `${VENV_PYTHON} ${tempSeedScriptPath}`,
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