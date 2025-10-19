# Railpack Deployment Guide for PyPIStats.dev

This guide explains how to deploy PyPIStats.dev using Railpack.

## Prerequisites

1. A Railpack account
2. A PostgreSQL database (Railpack provides managed PostgreSQL)
3. A Redis instance (Railpack provides managed Redis)
4. Google Cloud BigQuery credentials for data ingestion

## Deployment Steps

### 1. Prepare Your Environment

1. **Fork or clone this repository** to your GitHub account
2. **Set up your database and Redis** in your Railpack dashboard
3. **Prepare your Google Cloud credentials** for BigQuery access

### 2. Configure Environment Variables

Create a `.env` file in your project root with the following variables:

```bash
# Database Configuration (provided by Railpack)
DATABASE_URL=postgresql://username:password@host:5432/database_name?schema=public

# Redis Configuration (provided by Railpack)
REDIS_URL=redis://username:password@host:6379

# Google Cloud BigQuery Configuration
GOOGLE_PROJECT_ID=your-google-project-id
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}

# Application Configuration
NODE_ENV=production
PORT=3000

# Optional: Analytics
PLAUSIBLE_DOMAIN=your-domain.com
PLAUSIBLE_SCRIPT_URL=https://plausible.io/js/script.js
```

### 3. Deploy with Railpack

1. **Connect your repository** to Railpack
2. **Select the build method**: Use the `railpack.Dockerfile`
3. **Configure build settings**:
   - Build Command: `pnpm install --frozen-lockfile && pnpm run build`
   - Start Command: `pnpm run db:deploy && pnpm start`
   - Port: `3000`

4. **Set environment variables** in the Railpack dashboard using the values from your `.env` file

5. **Deploy** your application

### 4. Post-Deployment

After deployment:

1. **Verify database migrations** ran successfully
2. **Test the API endpoints** to ensure data ingestion works
3. **Check Redis connectivity** for caching functionality

## Configuration Files

### railpack.json
Contains the Railpack-specific configuration including:
- Build and start commands
- Port configuration
- Health check settings
- Required dependencies (PostgreSQL, Redis)

### railpack.Dockerfile
Optimized Dockerfile for Railpack deployment with:
- Multi-stage build for smaller production image
- Alpine Linux base for security and size
- Proper user permissions
- Health checks

### railpack.env
Template for environment variables needed for deployment

## API Endpoints

Once deployed, your application will expose these API endpoints:

- `GET /api/packages/{package}/recent?period=month` - Recent download stats
- `GET /api/packages/{package}/overall?mirrors=false` - Overall download stats
- `GET /api/packages/{package}/python_major?version=3` - Python major version stats
- `GET /api/packages/{package}/python_minor?version=3.11` - Python minor version stats
- `GET /api/packages/{package}/system?os=Linux` - System-specific stats
- `GET /api/packages/{package}/installer` - Installer tool stats

## Troubleshooting

### Common Issues

1. **Database connection errors**: Verify your `DATABASE_URL` is correct
2. **Redis connection errors**: Check your `REDIS_URL` configuration
3. **BigQuery authentication**: Ensure your service account JSON is properly formatted
4. **Build failures**: Check that all dependencies are properly installed

### Logs

Check the Railpack logs for detailed error information:
- Build logs for compilation issues
- Runtime logs for application errors
- Database logs for connection problems

## Performance Considerations

- The application uses Redis for caching to improve response times
- Database queries are optimized with proper indexing
- BigQuery data is ingested on-demand to reduce costs
- Consider setting up monitoring for database and Redis usage

## Security

- Never commit your `.env` file to version control
- Use Railpack's secure environment variable storage
- Regularly rotate your database and Redis passwords
- Keep your Google Cloud service account credentials secure

## Support

For issues specific to this application, please check the main README.md or create an issue in the repository.

For Railpack-specific issues, consult the Railpack documentation or support channels.