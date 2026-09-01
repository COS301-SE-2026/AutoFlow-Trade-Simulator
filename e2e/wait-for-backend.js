import { error } from "node:console";
import { resolve } from "node:dns";

const BACKEND_HEALTH_URL = process.env.BACKEND_HEALTH_URL || 'http://127.0.0.1:8000/health';
const MAX_ATTEMPTS = 30;
const DELAY_MS = 1000;

export default async function globalSetup() {
    console.log(`waiting for backend at url ${BACKEND_HEALTH_URL}...`);

    for (let i = 1; i <= MAX_ATTEMPTS; i++) {
        try {
            const res = await fetch(BACKEND_HEALTH_URL);
            if (res.ok) {
                const body = await res.json();
                if (body.status === 'ok') {
                    console.log('backend is ready.');
                    return;
                }
            }
        } catch {

        }
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }

    throw new error(`backend not ready after ${MAX_ATTEMPTS} attempts.`)
}