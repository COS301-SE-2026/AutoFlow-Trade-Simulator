import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.DEPLOYED_API_URL;
const TEST_USER = {
    email: __ENV.TEST_USER_EMAIL,
    password: __ENV.TEST_USER_PASSWORD
}
const ACCOUNT_ID = 21;

export const options = {
    stages: [
        { duration: '1m', target: 50 },
        { duration: '5m', target: 50 },
        { duration: '1m', target: 0 }
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],
        http_req_failed: ['rate<0.01'],
        'http_req_duration{endpoint:marketAssets}': ['p(95)<400'],
        'http_req_duration{endpoint:portfolioTrade}': ['p(95)<500']
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

    // Market Data
    const ticker = 'AAPL';
    http.get(`${BASE_URL}/market-data/assets`, { headers: authHeaders, tags: { endpoint: 'marketAssets' } });
    http.get(`${BASE_URL}/market-data/assets/${ticker}/prices`, { headers: authHeaders });
    http.get(`${BASE_URL}/market-data/assets/${ticker}/summary`, { headers: authHeaders });

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

    http.get(`${BASE_URL}/portfolio/accounts/${ACCOUNT_ID}/transactions`, { headers: authHeaders });

    const tradeResBuy = http.post(`${BASE_URL}/portfolio/accounts/${ACCOUNT_ID}`, portfolioPayloadBuy, { headers: authHeaders, tags: { endpoint: 'portfolioTrade' } });
    const tradeResSell = http.post(`${BASE_URL}/portfolio/accounts/${ACCOUNT_ID}`, portfolioPayloadSell, { headers: authHeaders, tags: { endpoint: 'portfolioTrade' } });

    check(tradeResBuy, {
        'trade success': (r) => r.status === 200
    })
    check(tradeResSell, {
        'trade success': (r) => r.status === 200
    })

    http.get(`${BASE_URL}/portfolio/accounts/${ACCOUNT_ID}/holdings`, { headers: authHeaders });

    // Auth
    http.post(`${BASE_URL}/auth/login`, loginPayload, { headers: authHeaders });
    // http.post(`${BASE_URL}/auth/register`,, { headers: authHeaders });
    // http.post(`${BASE_URL}/auth/google`,, { headers: authHeaders });

    // Accounts
    http.get(`${BASE_URL}/accounts`, { headers: authHeaders });
    // http.post(`${BASE_URL}/accounts`,, { headers: authHeaders });
    http.get(`${BASE_URL}/accounts/${ACCOUNT_ID}`, { headers: authHeaders });

    // Reports
    const reportPayload = JSON.stringify({
        period: '1d'
    });

    http.get(`${BASE_URL}/reports/`, { headers: authHeaders });
    http.post(`${BASE_URL}/reports/`, reportPayload, { headers: authHeaders });

    // Simulation
    const strategy_id = 1;
    const simulation_id = 1;

    http.get(`${BASE_URL}/simulation/strategies`, { headers: authHeaders });
    http.get(`${BASE_URL}/simulation/strategies/${strategy_id}`, { headers: authHeaders });
    http.post(`${BASE_URL}/simulation/practice/simulate`, reportPayload, { headers: authHeaders });
    http.post(`${BASE_URL}/simulation/practice/simulate/actions`, reportPayload, { headers: authHeaders });
    http.post(`${BASE_URL}/simulation/practice/simulate/${simulation_id}/finish`, reportPayload, { headers: authHeaders });

    // Real Time Data
    const symbol = 'AAPL';

    http.get(`${BASE_URL}/real_time/points/${symbol}`, { headers: authHeaders });
    http.get(`${BASE_URL}/real_time/list`, { headers: authHeaders });

    // News
    http.post(`${BASE_URL}/news/create`, reportPayload, { headers: authHeaders });
    http.post(`${BASE_URL}/news`, reportPayload, { headers: authHeaders });

    sleep(1);
}