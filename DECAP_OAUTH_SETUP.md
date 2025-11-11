# Decap CMS OAuth Setup Guide

This project uses Decap CMS (formerly Netlify CMS) with GitHub OAuth for authentication.

## Overview

Since Netlify Identity is deprecated, this project has been configured to use **GitHub OAuth** authentication with Decap CMS. This allows authorized GitHub users to access and edit content through the CMS interface.

## Prerequisites

- A GitHub account with access to the repository: `persephonepunch/headlessshopify`
- A Netlify account (for OAuth handling)
- Repository deployed to Netlify

## Setup Steps

### 1. Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the application details:
   - **Application name**: `Headless Shopify CMS` (or your preferred name)
   - **Homepage URL**: Your production site URL (e.g., `https://yoursite.netlify.app`)
   - **Authorization callback URL**: `https://api.netlify.com/auth/done`
4. Click **"Register application"**
5. Copy the **Client ID**
6. Generate a **Client Secret** and copy it

### 2. Configure Environment Variables

1. Open the [.env](.env) file in the project root
2. Replace the placeholder values:
   ```bash
   GITHUB_CLIENT_ID=your_actual_github_client_id
   GITHUB_CLIENT_SECRET=your_actual_github_client_secret
   NETLIFY_SITE_ID=your_netlify_site_id
   SITE_URL=https://yoursite.netlify.app
   ```

### 3. Configure Netlify

1. Log in to your [Netlify Dashboard](https://app.netlify.com/)
2. Select your site
3. Go to **Site Settings** → **Access control** → **OAuth**
4. Under **Authentication providers**, click **"Install provider"**
5. Select **GitHub**
6. Enter your **Client ID** and **Client Secret** from Step 1
7. Click **"Install"**

### 4. Deploy Your Site

Once configured, deploy your site to Netlify:

```bash
# Build the site
npm run build

# Deploy with Netlify CLI (if installed)
netlify deploy --prod
```

Or use Git-based deployment by pushing to your main branch.

## Accessing the CMS

1. Navigate to `https://yoursite.netlify.app/admin/`
2. Click **"Login with GitHub"**
3. Authorize the application
4. You'll be redirected to the CMS dashboard

## Configuration Files

### [admin/config.yml](admin/config.yml)

```yaml
backend:
  name: github
  repo: persephonepunch/headlessshopify
  branch: main
```

This configuration tells Decap CMS to:
- Use GitHub as the backend
- Connect to the specified repository
- Commit changes to the `main` branch

### [admin/index.html](admin/index.html)

The Netlify Identity widget has been removed since we're using GitHub OAuth instead.

## Security Notes

- **Never commit your `.env` file** - It contains sensitive credentials
- The [.env.example](.env.example) file is provided as a template
- The [.gitignore](.gitignore) file is configured to exclude `.env` files
- Only users with write access to the GitHub repository can access the CMS

## Granting Access to Team Members

To allow team members to use the CMS:

1. Add them as collaborators to the GitHub repository
2. Grant them at least **Write** permission
3. They can then authenticate using their own GitHub accounts

## Troubleshooting

### "Error: Failed to load entries"
- Verify your GitHub OAuth app credentials in Netlify
- Check that the repository name in `admin/config.yml` is correct
- Ensure the user has write access to the repository

### "Authentication Error"
- Verify the Authorization callback URL is set to `https://api.netlify.com/auth/done`
- Check that the OAuth app is installed in Netlify
- Clear browser cache and try again

### "Not Found" when accessing /admin
- Ensure the `admin` folder is being deployed to Netlify
- Check that `admin/index.html` exists and is accessible
- Verify the `publish` directory in [netlify.toml](netlify.toml) is correct

## Local Development

For local development with OAuth:

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Run the development server:
   ```bash
   netlify dev
   ```

3. Access the CMS at `http://localhost:8888/admin/`

The Netlify CLI will handle OAuth authentication locally.

## Migration from Netlify Identity

If you previously used Netlify Identity:

- ✅ Netlify Identity widget removed from `admin/index.html`
- ✅ Backend changed from `git-gateway` to `github`
- ✅ OAuth configuration added
- ⚠️ Users will need to re-authenticate using their GitHub accounts

## Additional Resources

- [Decap CMS Documentation](https://decapcms.org/docs/)
- [GitHub Backend Configuration](https://decapcms.org/docs/github-backend/)
- [Netlify OAuth Setup](https://docs.netlify.com/visitor-access/oauth-provider-tokens/)
- [GitHub OAuth Apps](https://docs.github.com/en/developers/apps/building-oauth-apps)

## Support

For issues or questions:
- Check the [Decap CMS GitHub Issues](https://github.com/decaporg/decap-cms/issues)
- Review the [Netlify Support Forums](https://answers.netlify.com/)
- Contact your repository administrator
