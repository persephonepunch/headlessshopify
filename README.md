# Headless Shopify with Eleventy, Decap CMS, and Netlify

This project is a headless Shopify storefront built with Eleventy, a static site generator. It uses Decap CMS (formerly Netlify CMS) for content management and is configured for deployment on Netlify.

## Features

*   **Headless Shopify:** Decouples the storefront from the Shopify backend.
*   **Eleventy:** A flexible and fast static site generator.
*   **Decap CMS:** For content management, integrated with GitHub for authentication.
*   **Netlify:** For continuous deployment and hosting.
*   **GitHub OAuth:** Secure authentication for Decap CMS.

## Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18 or higher)
*   [npm](https://www.npmjs.com/)
*   A [Shopify](https://www.shopify.com/) account with a storefront.
*   A [GitHub](https://github.com/) account.
*   A [Netlify](https://www.netlify.com/) account.

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/persephonepunch/headlessshopify.git
    cd headlessshopify
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the root of the project by copying the `.env.example` file:

    ```bash
    cp .env.example .env
    ```

    You will need to populate this file with your own keys and IDs. See the "Configuration" sections below for more details.

## Deployment

This project is configured for continuous deployment on Netlify.

### Netlify CI/CD

The `netlify.toml` file in the root of the project configures the build and deployment settings for Netlify:

```toml
[build]
publish = "public"
command = "npm run build"
functions = "functions"

# API redirects for functions
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
  force = true
```

*   `publish = "public"`: Netlify will deploy the `public` directory.
*   `command = "npm run build"`: This command is run to build the site.
*   `functions = "functions"`: Serverless functions are located in the `functions` directory.

When you push to the `main` branch of your GitHub repository, Netlify will automatically build and deploy the site.

### Netlify Private Key Setup

For secure access to APIs and services, you need to set up environment variables in Netlify.

1.  Go to your site's dashboard on Netlify.
2.  Navigate to **Site settings > Build & deploy > Environment**.
3.  Add the following environment variables from your `.env` file:
    *   `GITHUB_CLIENT_ID`
    *   `GITHUB_CLIENT_SECRET`
    *   `NETLIFY_SITE_ID`
    *   `SITE_URL`
    *   Any other sensitive keys your project requires.

## CMS (Decap CMS)

This project uses Decap CMS for content management.

### GitHub OAuth Authentication

Authentication is handled via GitHub OAuth. Refer to the `DECAP_OAUTH_SETUP.md` file for detailed instructions on how to set up the GitHub OAuth app and configure Netlify.

### CMS Configuration

The Decap CMS is configured in `admin/config.yml`:

```yaml
backend:
  name: github
  repo: persephonepunch/headlessshopify
  branch: main
```

This configuration tells Decap CMS to use the `main` branch of the `persephonepunch/headlessshopify` repository on GitHub as the backend.

### Accessing the CMS

Once deployed, you can access the CMS at `https://<your-site-url>/admin/`. You will be prompted to log in with your GitHub account. Only users with write access to the repository will be able to authenticate.

## Authentication

The authentication flow for the CMS is as follows:

1.  A user navigates to `/admin/`.
2.  The user clicks "Login with GitHub".
3.  The user is redirected to GitHub to authorize the OAuth app.
4.  Upon successful authorization, GitHub redirects the user to a Netlify endpoint.
5.  Netlify handles the authentication and redirects the user back to the CMS, now authenticated.

The serverless functions in the `/functions` directory, such as `oauth.js` and `github-callback.js`, handle the server-side logic for the OAuth flow.

## Local Development

To run the project locally:

1.  **Install the Netlify CLI:**

    ```bash
    npm install -g netlify-cli
    ```

2.  **Run the development server:**

    ```bash
    netlify dev
    ```

    This command will start a local server with a live preview and handle local OAuth authentication for the CMS.

3.  **Access the site and CMS:**
    *   **Site:** `http://localhost:8888`
    *   **CMS:** `http://localhost:8888/admin/`

## Project Structure

```
/
├── admin/              # Decap CMS files
├── cms/                # Content files and templates for Eleventy
├── functions/          # Serverless functions for Netlify
├── theme/              # Eleventy theme files (layouts, partials, assets)
├── _utils/             # Eleventy utility functions (filters, shortcodes)
├── .eleventy.js        # Eleventy configuration file
├── netlify.toml        # Netlify configuration file
├── package.json        # Project dependencies and scripts
└── README.md           # This file
```
