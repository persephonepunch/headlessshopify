# Xano Authentication Setup Guide for Decap CMS

## Step 1: Create a Xano Workspace

1. Go to **[xano.com](https://xano.com)** and sign up (free tier available)
2. Create a new workspace called `headlessshopify` or similar
3. Create a new API Group called `CMS Auth`

## Step 2: Set Up Xano Database Tables

### Table 1: Users
Create a table with these fields:

| Field Name | Type | Settings |
|-----------|------|----------|
| email | Email | Unique, Required |
| password | Text | Required, Encrypted |
| first_name | Text | Optional |
| last_name | Text | Optional |
| role | Text | Default: "viewer" |
| created_at | Created Date | Auto |
| updated_at | Updated Date | Auto |

### Table 2: Roles
Create a table with these fields:

| Field Name | Type | Settings |
|-----------|------|----------|
| name | Text | Unique, Required |
| description | Text | Optional |
| permissions | Array of Text | Optional |

**Sample Roles to insert:**
```
{
  "name": "admin",
  "description": "Full access to all collections",
  "permissions": ["*"]
}

{
  "name": "editor",
  "description": "Can edit all collections",
  "permissions": ["gaming_laptops", "gaming_monitors", "gaming_desktops", "gaming_mice", "gaming_keyboards", "gaming_earbuds", "gaming_headsets", "gaming_accessories", "content_creation", "console_gaming", "gaming_bundles", "category", "product", "pages", "collections", "tags", "microphones", "gaming_mouse_pads"]
}

{
  "name": "contributor",
  "description": "Limited edit access",
  "permissions": ["gaming_laptops", "gaming_monitors"]
}

{
  "name": "viewer",
  "description": "Read-only access",
  "permissions": []
}
```

### Table 3: User Permissions
Create a table for granular control:

| Field Name | Type | Settings |
|-----------|------|----------|
| user_id | Link to Users | Required |
| collection_name | Text | Required |
| can_read | Boolean | Default: true |
| can_write | Boolean | Default: false |
| can_delete | Boolean | Default: false |

## Step 3: Create Xano API Endpoints

### Endpoint 1: Login
- **Path:** `/login`
- **Method:** POST
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Authentication:** Call query `GET Users` where email = request.body.email
- **Logic:**
  1. Query user by email
  2. Check if user exists
  3. Verify password (use Xano's password verification)
  4. Generate JWT token (Xano has built-in token generation)
  5. Return token + user data
- **Response:**
  ```json
  {
    "success": true,
    "token": "eyJhbGc...",
    "user": {
      "id": "123",
      "email": "user@example.com",
      "first_name": "John",
      "role": "editor"
    }
  }
  ```

### Endpoint 2: Validate Token
- **Path:** `/validate`
- **Method:** POST
- **Request Header:** `Authorization: Bearer {token}`
- **Logic:**
  1. Decode JWT token
  2. Check if token is valid
  3. Return user data if valid
- **Response:**
  ```json
  {
    "valid": true,
    "user": {
      "id": "123",
      "email": "user@example.com",
      "role": "editor"
    },
    "permissions": ["gaming_laptops", "gaming_monitors", ...]
  }
  ```

### Endpoint 3: Get User Permissions
- **Path:** `/permissions/:user_id`
- **Method:** GET
- **Response:**
  ```json
  {
    "collections": {
      "gaming_laptops": { "read": true, "write": true, "delete": false },
      "gaming_monitors": { "read": true, "write": true, "delete": false }
    }
  }
  ```

### Endpoint 4: Create User (Admin Only)
- **Path:** `/users`
- **Method:** POST
- **Request Body:**
  ```json
  {
    "email": "newuser@example.com",
    "password": "securepass",
    "first_name": "Jane",
    "last_name": "Doe",
    "role": "editor"
  }
  ```

## Step 4: Get Your Xano API Key

1. In your Xano workspace, go to **Settings** → **API Keys**
2. Create a new API key (this is your `XANO_API_KEY`)
3. Copy your **Xano Base URL** (e.g., `https://your-workspace.xano.io`)

## Step 5: Set Environment Variables on Netlify

```bash
netlify env:set XANO_BASE_URL "https://your-workspace.xano.io"
netlify env:set XANO_API_KEY "your-api-key-here"
netlify env:set XANO_AUTH_SECRET "your-secret-for-signing-tokens"
```

## Step 6: Test Your Setup

Once you've created the Xano endpoints and set the environment variables:

1. Visit `https://headlessshopify.netlify.app/admin/`
2. You should see a login form
3. Log in with your Xano user credentials
4. You'll be granted access to Decap CMS based on your role/permissions

## Sample Users to Create in Xano

```
1. Admin User
   Email: admin@example.com
   Password: AdminPassword123
   Role: admin

2. Editor User
   Email: editor@example.com
   Password: EditorPassword123
   Role: editor
   Permissions: All collections

3. Contributor User
   Email: contributor@example.com
   Password: ContributorPassword123
   Role: contributor
   Permissions: gaming_laptops, gaming_monitors
```

## Collections Available for Permission Assignment

These are your Decap CMS collections that can be assigned to users:
- `gaming_laptops`
- `gaming_monitors`
- `gaming_desktops`
- `gaming_mice`
- `gaming_keyboards`
- `gaming_earbuds`
- `gaming_headsets`
- `gaming_accessories`
- `content_creation`
- `console_gaming`
- `gaming_bundles`
- `category`
- `product`
- `pages`
- `collections`
- `tags`
- `microphones`
- `gaming_mouse_pads`

## Troubleshooting

**Q: How do I test my Xano API?**
A: Use Xano's built-in API testing tool in the dashboard, or use Postman/Insomnia with your API keys.

**Q: Can I use OAuth providers with Xano?**
A: Yes! Xano supports connecting to GitHub OAuth, Google OAuth, etc. See Xano docs for OAuth setup.

**Q: How do I reset a user's password?**
A: Create another endpoint `/reset-password` that takes email and sends reset link.

## Next Steps

1. ✅ Create Xano workspace and tables
2. ✅ Create API endpoints
3. ✅ Set environment variables
4. ✅ Deploy to Netlify
5. ✅ Create test users
6. ✅ Test login flow
