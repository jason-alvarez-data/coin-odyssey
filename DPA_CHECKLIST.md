# Data Processing Agreement (DPA) Checklist - Coin Odyssey

## 🎯 Current Status Assessment

### ✅ **Services with Automatic DPA Coverage:**
- **Supabase** - Provides GDPR-compliant DPA automatically
- **Google OAuth** - Covered under Google's developer terms
- **GitHub OAuth** - Covered under GitHub's developer agreement
- **Google Fonts** - Generally considered minimal processing

### ❓ **Services Requiring DPA Verification:**
- **Numista API** - Review API terms for data processing clauses
- **PCGS API** - Check for DPA or data processing provisions
- **Custom API endpoints** (if any) - Verify compliance

### 🔍 **Services to Investigate:**
- **Hosting Provider** (Vercel/Netlify/etc.) - Check DPA availability
- **Analytics** (Google Analytics/Plausible/etc.) - If implemented
- **Email Service** (SendGrid/Resend/etc.) - If using transactional emails
- **Error Tracking** (Sentry/LogRocket/etc.) - If implemented

## 📋 **Action Items by Priority:**

### **High Priority (Complete First):**
1. ✅ **Supabase DPA** - Already compliant
2. 🔲 **Download Supabase DPA** - Save a copy for records
3. 🔲 **Review Numista Terms** - Check data processing clauses
4. 🔲 **Review PCGS Terms** - Verify DPA or equivalent coverage

### **Medium Priority:**
5. 🔲 **Hosting Provider DPA** - If using Vercel/Netlify
6. 🔲 **Analytics DPA** - If using any analytics services
7. 🔲 **Email Service DPA** - If sending transactional emails

### **Low Priority (Future Services):**
8. 🔲 **Payment Processor DPA** - When implementing payments
9. 🔲 **Additional API Services** - As you add new integrations

## 📄 **What Makes a Good DPA:**

A proper DPA should include:
- **Data processing purposes** clearly defined
- **Data categories** being processed
- **Retention periods** specified
- **Security measures** outlined
- **Data subject rights** protection
- **Cross-border transfer** safeguards (if applicable)
- **Incident response** procedures

## 🎯 **For Your Termly.io Privacy Policy:**

### **Recommended Answer:**
**"Yes, we have data processing agreements in place with our key third-party service providers, including our database provider (Supabase) and authentication services. We are committed to ensuring all service providers meet GDPR compliance standards."**

### **Services to Mention in Privacy Policy:**
```
Our key third-party processors include:
- Supabase (database and authentication services)
- Numista (coin information and pricing data)  
- PCGS (professional coin grading data)
- Google/GitHub (authentication services)
- [Your hosting provider] (website hosting)
```

## 📞 **Next Steps:**

1. **Review Supabase DPA**: Log into Supabase dashboard → Settings → Legal
2. **Contact API Providers**: Reach out to Numista and PCGS about data processing terms
3. **Document Everything**: Keep copies of all DPAs and agreements
4. **Update Privacy Policy**: Use the recommended language in Termly.io
5. **Set Review Schedule**: Quarterly review of all DPAs

## 🔗 **Useful Resources:**

- **Supabase Privacy & DPA**: https://supabase.com/privacy
- **GDPR DPA Requirements**: https://gdpr.eu/data-processing-agreement/
- **Termly DPA Guide**: https://termly.io/resources/articles/data-processing-agreement/

## 📝 **Notes:**

- DPAs are required under GDPR for any service that processes EU user data
- Even if users aren't in EU, having DPAs shows privacy commitment
- Some services include DPA terms in their main service agreement
- Keep all agreements accessible for compliance audits 