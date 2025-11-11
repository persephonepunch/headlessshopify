/**
 * OAuth proxy for GitHub - allows Decap CMS to authenticate with GitHub
 * Handles both the authorization redirect AND the token exchange
 */

const https = require('https');
const querystring = require('querystring');

exports.handler = async (event) => {
    const method = event.httpMethod;
    const query = event.queryStringParameters || {};
    
    console.log(`OAuth handler: ${method}`, query);
    
    // Handle authorization request - redirect to GitHub
    if (method === 'GET' && !query.code) {
        const clientId = process.env.GITHUB_CLIENT_ID;
        const redirectUri = `${process.env.SITE_URL}/auth/github/callback`;
        const scope = 'repo';
        
        const githubAuthUrl = `https://github.com/login/oauth/authorize?` +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `scope=${encodeURIComponent(scope)}`;
        
        return {
            statusCode: 302,
            headers: {
                'Location': githubAuthUrl,
                'Cache-Control': 'no-cache'
            },
            body: ''
        };
    }
    
    // Handle callback - exchange code for token
    if (method === 'GET' && query.code) {
        const code = query.code;
        
        try {
            const tokenData = await exchangeCodeForToken(code);
            
            // Return token as JSON for Decap CMS
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'no-cache'
                },
                body: JSON.stringify({
                    token: tokenData.access_token,
                    provider: 'github',
                    github_token: tokenData.access_token
                }),
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
    
    // Handle OPTIONS for CORS
    if (method === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: ''
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
                    } else if (!data.access_token) {
                        reject(new Error('No access token in response'));
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