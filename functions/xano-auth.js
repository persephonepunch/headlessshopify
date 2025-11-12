/**
 * Xano Authentication Handler
 * Validates user credentials against Xano backend
 * Returns token and user permissions
 */

const https = require('https');

exports.handler = async (event) => {
    const method = event.httpMethod;
    const path = event.path || '';
    
    console.log(`Xano Auth: ${method} ${path}`);
    
    // Get Xano config from environment
    const XANO_BASE_URL = process.env.XANO_BASE_URL;
    const XANO_API_KEY = process.env.XANO_API_KEY; // optional: may be empty if you only have a user JWT

    if (!XANO_BASE_URL) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'XANO_BASE_URL not configured' }),
        };
    }
    
    try {
        // Handle login request
        if (method === 'POST' && path.includes('/login')) {
            const body = JSON.parse(event.body || '{}');
            const { email, password } = body;
            
            if (!email || !password) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Email and password required' }),
                };
            }
            
            // Call Xano login endpoint
            const loginResult = await callXanoAPI('/login', 'POST', {
                email,
                password
            }, XANO_BASE_URL, XANO_API_KEY);
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify(loginResult),
            };
        }
        
        // Handle token validation
        if (method === 'POST' && path.includes('/validate')) {
            const token = event.headers.authorization?.replace('Bearer ', '');

            if (!token && !XANO_API_KEY) {
                return {
                    statusCode: 401,
                    body: JSON.stringify({ error: 'No token provided and no workspace API key configured' }),
                };
            }

            // If we have a user JWT (token) forward it; otherwise use workspace API key
            const authHeader = token ? `Bearer ${token}` : `Bearer ${XANO_API_KEY}`;

            // Call Xano validate endpoint (expects auth header)
            const validationResult = await callXanoAPI('/validate', 'POST', 
                {}, 
                XANO_BASE_URL, 
                XANO_API_KEY,
                { Authorization: authHeader }
            );
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify(validationResult),
            };
        }
        
        // Handle permissions request
        if (method === 'GET' && path.includes('/permissions')) {
            const token = event.headers.authorization?.replace('Bearer ', '');

            if (!token && !XANO_API_KEY) {
                return {
                    statusCode: 401,
                    body: JSON.stringify({ error: 'No token provided and no workspace API key configured' }),
                };
            }

            const authHeader = token ? `Bearer ${token}` : `Bearer ${XANO_API_KEY}`;

            // Get user permissions from Xano (we forward auth header)
            const permissionsResult = await callXanoAPI('/permissions', 'POST', 
                {}, 
                XANO_BASE_URL, 
                XANO_API_KEY,
                { Authorization: authHeader }
            );
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify(permissionsResult),
            };
        }
        
        // Handle OPTIONS
        if (method === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                },
                body: ''
            };
        }
        
        return {
            statusCode: 404,
            body: JSON.stringify({ error: 'Not found' }),
        };
        
    } catch (error) {
        console.error('Xano auth error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};

/**
 * Call Xano API endpoint
 */
function callXanoAPI(path, method, data, baseUrl, apiKey, extraHeaders = {}) {
    return new Promise((resolve, reject) => {
        // Build full URL from baseUrl + path
        const url = new URL(path, baseUrl);
        const hostname = url.hostname;
        const pathname = url.pathname + (url.search || '');

        const postData = JSON.stringify(data || {});

        // Build headers; prefer extraHeaders.Authorization if provided, otherwise use apiKey
        const headers = Object.assign({}, extraHeaders);
        headers['Content-Type'] = 'application/json';
        headers['Content-Length'] = Buffer.byteLength(postData);

        if (!headers.Authorization && apiKey) {
            headers.Authorization = `Bearer ${apiKey}`;
        }

        const options = {
            hostname,
            path: pathname,
            method,
            headers,
        };

        console.log(`Calling Xano: ${hostname}${pathname}`);

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => { body += chunk; });
            res.on('end', () => {
                try {
                    const response = body ? JSON.parse(body) : {};
                    if (res.statusCode >= 400) {
                        reject(new Error(response.error || `HTTP ${res.statusCode}`));
                    } else {
                        resolve(response);
                    }
                } catch (e) {
                    reject(new Error(`Invalid JSON response: ${body}`));
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
