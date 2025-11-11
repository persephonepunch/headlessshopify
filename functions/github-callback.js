/**
 * Netlify Function: GitHub OAuth Handler
 * Handles the GitHub OAuth callback and token exchange
 */

const https = require('https');

exports.handler = async (event) => {
    const code = event.queryStringParameters?.code;
    const state = event.queryStringParameters?.state;

    if (!code) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'No code provided' }),
        };
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    try {
        // Exchange code for access token
        const tokenResponse = await exchangeCodeForToken(code, clientId, clientSecret);

        // Redirect to success page with token
        return {
            statusCode: 301,
            headers: {
                Location: `/admin/#/auth/done?access_token=${tokenResponse.access_token}&provider=github`,
            },
        };
    } catch (error) {
        console.error('OAuth error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Authentication failed', details: error.message }),
        };
    }
};

function exchangeCodeForToken(code, clientId, clientSecret) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
        });

        const options = {
            hostname: 'github.com',
            port: 443,
            path: '/login/oauth/access_token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'Accept': 'application/json',
                'User-Agent': 'Decap-CMS',
            },
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.error) {
                        reject(new Error(parsed.error_description || parsed.error));
                    } else {
                        resolve(parsed);
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.write(postData);
        req.end();
    });
}
