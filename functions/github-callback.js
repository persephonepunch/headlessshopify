/**
 * Netlify Function: GitHub OAuth Handler
 * Handles the GitHub OAuth callback and token exchange for Decap CMS
 */

const https = require('https');

exports.handler = async (event) => {
    const code = event.queryStringParameters?.code;

    if (!code) {
        // No code - user hasn't been redirected from GitHub yet
        // This is the initial login endpoint
        const clientId = process.env.GITHUB_CLIENT_ID;
        const redirectUri = 'https://headlessshopify.netlify.app/auth/github/callback';
        const scope = 'repo';
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
        
        return {
            statusCode: 302,
            headers: {
                Location: authUrl,
            },
        };
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    try {
        // Exchange code for access token
        const tokenResponse = await exchangeCodeForToken(code, clientId, clientSecret);

        // Return HTML that will store the token and redirect
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>GitHub Authentication</title>
    <script>
        // Store the token in localStorage
        localStorage.setItem('github_access_token', '${tokenResponse.access_token}');
        
        // Redirect back to the admin
        window.location.href = '/admin/';
    </script>
</head>
<body>
    <p>Authenticating...</p>
</body>
</html>
        `;

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
            },
            body: html,
        };
    } catch (error) {
        console.error('OAuth error:', error);
        const errorHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Authentication Error</title>
    <style>
        body {
            font-family: sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #f5f5f5;
        }
        .error-box {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            max-width: 500px;
        }
        h1 {
            color: #e74c3c;
        }
        p {
            color: #666;
        }
    </style>
</head>
<body>
    <div class="error-box">
        <h1>Authentication Failed</h1>
        <p>${error.message}</p>
        <p><a href="/admin/">← Back to CMS</a></p>
    </div>
</body>
</html>
        `;

        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
            },
            body: errorHtml,
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
