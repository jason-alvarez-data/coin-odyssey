# Vercel Deployment Checklist

## Pre-Deployment Requirements

### ✅ Environment Variables (Configure in Vercel Dashboard)
Add these environment variables in your Vercel project settings:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_PCGS_API_KEY=your_pcgs_api_key
NEXT_PUBLIC_PCGS_API_BASE_URL=https://api.pcgs.com/v1
NEXT_PUBLIC_NUMISTA_API_KEY=your_numista_api_key
NEXT_PUBLIC_COIN_API_PROVIDER=numista
NEXT_PUBLIC_COIN_API_KEY=your_coin_api_key
NEXT_PUBLIC_COIN_API_BASE_URL=your_coin_api_base_url
```

### ✅ Supabase Configuration
1. Ensure your Supabase project is set up and configured
2. Add your Vercel deployment URL to Supabase Auth settings:
   - Go to Authentication > Settings > Site URL
   - Add your production domain (e.g., `https://your-app.vercel.app`)
   - Add redirect URLs for auth callbacks

### ✅ Build Configuration
- [x] ESLint configuration updated to allow build to pass
- [x] Next.js config optimized for production
- [x] Environment variables properly configured

### ✅ Database Setup
1. Ensure your Supabase database tables are created
2. Run any necessary migrations
3. Set up Row Level Security (RLS) policies
4. Verify storage buckets are configured if using file uploads

### ✅ Domain & SSL
1. Configure custom domain in Vercel (optional)
2. SSL certificates are automatically handled by Vercel

### ✅ Performance Optimizations
- [ ] Replace remaining `<img>` tags with Next.js `<Image>` components
- [x] Image optimization configured in next.config.js
- [x] Security headers configured

## Deployment Steps

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Configure Build Settings**: 
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
3. **Add Environment Variables**: Copy from .env.example and fill in real values
4. **Deploy**: Vercel will automatically deploy when you push to main branch

## Post-Deployment Verification

- [ ] Test authentication flow
- [ ] Verify database connections
- [ ] Test coin collection features
- [ ] Check API integrations (PCGS, Numista)
- [ ] Test file uploads (if applicable)
- [ ] Verify responsive design on mobile/tablet
- [ ] Test PWA functionality (if enabled)

## Monitoring & Maintenance

- [ ] Set up Vercel Analytics
- [ ] Configure error monitoring (Sentry, LogRocket, etc.)
- [ ] Set up uptime monitoring
- [ ] Schedule regular database backups
- [ ] Plan for API rate limit monitoring

## Troubleshooting Common Issues

1. **Build Failures**: Check environment variables and ESLint errors
2. **Auth Issues**: Verify Supabase URLs and redirect settings
3. **API Errors**: Check API keys and rate limits
4. **Image Loading**: Ensure Supabase storage permissions are correct 