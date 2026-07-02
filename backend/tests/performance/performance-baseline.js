import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.NEXT_PUBLIC_API_URL;
const TEST_USER = {
    email: __ENV.TEST_USER_EMAIL,
    password: __ENV.TEST_USER_PASSWORD
}
const ACCOUNT_ID = 6;

export const options = {
    stages: [
        { duration: '30s', target: 5 },
        { duration: '1m', target: 10 },
        { duration: '30s', target: 20 },
        { duration: '1m', target: 20 },
        { duration: '30s', target: 0 }
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],
        http_req_failed: ['rate<0.01']
    }
};

export default function performanceTest() {
    const loginPayload = JSON.stringify(TEST_USER);
    const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, { headers: { 'Content-Type': 'application/json' } });

    check(loginRes, {
        'login status 200': (r) => r.status === 200,
        'login has token': (r) => r.json('access_token') !== undefined
    });

    const token = loginRes.json('access_token');
    const authHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    if (!token) {
        console.error('Login failed — skipping remaining tests');
        return;
    }

    // http.get(`${BASE_URL}/`, { headers: authHeaders });
    // http.post(`${BASE_URL}/`,, { headers: authHeaders });

    // Core
    http.get(`${BASE_URL}/health`, { headers: authHeaders });
    http.get(`${BASE_URL}/demo`, { headers: authHeaders });

    // Market Data
    http.get(`${BASE_URL}/market-data/status`, { headers: authHeaders });
    http.get(`${BASE_URL}/market-data/assets`, { headers: authHeaders });
    http.get(`${BASE_URL}/market-data/assets/{ticker}/prices`, { headers: authHeaders });
    http.get(`${BASE_URL}/market-data/assets/{ticker}/summary`, { headers: authHeaders });

    // UI
    http.get(`${BASE_URL}/ui/status`, { headers: authHeaders });

    // Portfolio
    const portfolioPayloadBuy = JSON.stringify({
        ticker: 'AAPL',
        direction: 'buy',
        quantity: 1
    });

    const portfolioPayloadSell = JSON.stringify({
        ticker: 'AAPL',
        direction: 'sell',
        quantity: 1
    });

    http.get(`${BASE_URL}/portfolio/status`, { headers: authHeaders });
    http.get(`${BASE_URL}/portfolio/accounts/${ACCOUNT_ID}/transactions`, { headers: authHeaders });

    const tradeResBuy = http.post(`${BASE_URL}/portfolio/accounts/${ACCOUNT_ID}`, portfolioPayloadBuy, { headers: authHeaders });
    const tradeResSell = http.post(`${BASE_URL}/portfolio/accounts/${ACCOUNT_ID}`, portfolioPayloadSell, { headers: authHeaders });

    check(tradeResBuy, {
        'trade success': (r) => r.status === 200
    })
    check(tradeResSell, {
        'trade success': (r) => r.status === 200
    })

    http.get(`${BASE_URL}/portfolio/accounts/${ACCOUNT_ID}/holdings`, { headers: authHeaders });

    // Auth
    http.get(`${BASE_URL}/auth/status`, { headers: authHeaders });
    // http.post(`${BASE_URL}/auth/login`,, { headers: authHeaders });
    // http.post(`${BASE_URL}/auth/register`,, { headers: authHeaders });

    // Accounts
    http.get(`${BASE_URL}/accounts/status`, { headers: authHeaders });
    http.get(`${BASE_URL}/accounts`, { headers: authHeaders });
    // http.post(`${BASE_URL}/accounts`,, { headers: authHeaders });
    http.get(`${BASE_URL}/accounts/${ACCOUNT_ID}`, { headers: authHeaders });

    // Reports
    const reportPayload = JSON.stringify({
        period: '1d'
    });

    http.get(`${BASE_URL}/reports/`, { headers: authHeaders });
    http.post(`${BASE_URL}/reports/`, reportPayload, { headers: authHeaders });

    sleep(1);
}