/**
 * OAuth proxy for GitHub - allows Decap CMS to authenticate with GitHub
 * This function handles the OAuth flow transparently
 */

const https = require('https');

exports.handler = async (event) => {
    const method = event.httpMethod;
    const path = event.path || '';
    
    console.log(`OAuth handler: ${method} ${path}`);
    
    // Handle GET requests (OAuth callback from GitHub)
    if (method === 'GET') {
        const code = event.queryStringParameters?.code;
        const state = event.queryStringParameters?.state;
        
        if (!code) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'No authorization code' }),
            };
        }
        
        try {
            const tokenData = await exchangeCodeForToken(code);
            
            // Build the success response that Decap CMS expects
            const response = {
                token: tokenData.access_token,
                provider: 'github',
            };
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify(response),
            };
        } catch (error) {
            console.error('Token exchange error:', error);
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ error: error.message }),
            };
        }
    }
    
    // Handle POST requests (for token refresh)
    if (method === 'POST') {
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ success: true }),
        };
    }
    
    return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' }),
    };
};

function exchangeCodeForToken(code) {
    return new Promise((resolve, reject) => {
        const clientId = process.env.GITHUB_CLIENT_ID;
        const clientSecret = process.env.GITHUB_CLIENT_SECRET;
        
        const postData = JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
        });
        
        const options = {
            hostname: 'github.com',
            path: '/login/oauth/access_token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Decap-CMS',
                'Content-Length': Buffer.byteLength(postData),
            },
        };
        
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => { body += chunk; });
            res.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    if (data.error) {
                        reject(new Error(data.error_description || data.error));
                    } else {
                        resolve(data);
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });
        
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}