/**
 * OAuth proxy for GitHub - handles both authorization and token exchange
 * Redirects back to /admin with token in query param
 */

const https = require('https');

exports.handler = async (event) => {
    const method = event.httpMethod;
    const query = event.queryStringParameters || {};
    
    console.log(`OAuth handler: ${method}`, query);
    
    // Handle authorization initiation - redirect to GitHub
    if (method === 'GET' && !query.code) {
        const clientId = process.env.GITHUB_CLIENT_ID;
        const redirectUri = `${process.env.SITE_URL}/.netlify/functions/oauth`;
        const scope = 'repo';
        
        const githubAuthUrl = `https://github.com/login/oauth/authorize?` +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `scope=${encodeURIComponent(scope)}&` +
            `allow_signup=true`;
        
        console.log('Redirecting to GitHub:', githubAuthUrl);
        
        return {
            statusCode: 302,
            headers: {
                'Location': githubAuthUrl,
                'Cache-Control': 'no-cache'
            },
            body: ''
        };
    }
    
    // Handle callback from GitHub - exchange code for token
    if (method === 'GET' && query.code) {
        const code = query.code;
        
        console.log('Received authorization code:', code.substring(0, 10) + '...');
        
        try {
            const tokenData = await exchangeCodeForToken(code);
            const token = tokenData.access_token;
            
            console.log('Successfully exchanged code for token');
            
            // Redirect back to admin with token in query param
            const adminUrl = `${process.env.SITE_URL}/admin/?token=${encodeURIComponent(token)}`;
            
            return {
                statusCode: 302,
                headers: {
                    'Location': adminUrl,
                    'Cache-Control': 'no-cache'
                },
                body: ''
            };
        } catch (error) {
            console.error('Token exchange error:', error.message);
            
            // Redirect to admin with error
            const errorUrl = `${process.env.SITE_URL}/admin/?error=${encodeURIComponent(error.message)}`;
            
            return {
                statusCode: 302,
                headers: {
                    'Location': errorUrl,
                    'Cache-Control': 'no-cache'
                },
                body: ''
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
        
        if (!clientId || !clientSecret) {
            reject(new Error('GitHub credentials not configured'));
            return;
        }
        
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
                    console.log('GitHub response:', body.substring(0, 100));
                    const data = JSON.parse(body);
                    if (data.error) {
                        reject(new Error(`GitHub error: ${data.error_description || data.error}`));
                    } else if (!data.access_token) {
                        reject(new Error('No access token in response'));
                    } else {
                        resolve(data);
                    }
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${e.message}`));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(new Error(`Request failed: ${error.message}`));
        });
        
        req.write(postData);
        req.end();
    });
}