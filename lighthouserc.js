const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const FRONTEND_URL = process.env.FRONTEND_URL;

module.exports = {
    "ci": {
        "collect": {
            "url": [
                `${FRONTEND_URL}`,
                `${FRONTEND_URL}/login`,
                `${FRONTEND_URL}/register`,
                `${FRONTEND_URL}/dashboard`
            ],
            "numberOfRuns": 1,
            "settings": {
                "preset": "desktop"
            }
        },
        "asset": {
            "assertions": {
                "categories:performance": [
                    "off"
                ],
                "categories:accessibility": [
                    "off"
                ],
                "categories:best-practices": [
                    "off"
                ],
                "categories:seo": [
                    "off"
                ]
            }
        },
        "upload": {
            "target": "filesystem",
            "outputDir": "./lhci-reports"
        }
    }
};