# Third-Party Disclosure Guide - Coin Odyssey

## 🎯 Quick Answer for Termly.io

**Question:** "Which third parties do you disclose users' personal information to?"

**Answer:** Select **"Service Providers Only"** or **"Limited Third Parties"**

## 📋 Complete List of Third-Party Data Sharing

### ✅ **Third Parties That Receive Personal Information:**

| Service | Personal Data Received | Purpose | Type |
|---------|----------------------|---------|------|
| **Supabase** | Email, user ID, profile data | Database & authentication | Service Provider |
| **Google OAuth** | Email, name, profile picture | Third-party sign-in | Authentication Provider |
| **GitHub OAuth** | Email, username, profile info | Third-party sign-in | Authentication Provider |
| **Hosting Provider** | IP addresses, access logs | Website hosting | Service Provider |

### ❌ **Services That DON'T Receive Personal Information:**

| Service | What They Receive | Purpose |
|---------|------------------|---------|
| **Numista API** | Coin IDs, search queries | Coin pricing data |
| **PCGS API** | Coin identifiers only | Coin grading data |
| **Google Fonts** | Font requests | Typography |

## 📝 **Recommended Privacy Policy Language:**

### **For "Third Party Disclosure" Section:**

```
PERSONAL INFORMATION SHARING

We may share your personal information only with the following types of third parties:

1. SERVICE PROVIDERS
   • Authentication services (Google, GitHub) for secure sign-in
   • Database services (Supabase) for data storage and account management  
   • Hosting providers for website operation
   
2. LEGAL REQUIREMENTS
   • When required by law or to protect our rights and safety

3. BUSINESS TRANSFERS
   • In connection with a merger, sale, or transfer of our business

DATA NOT SHARED:
• We do not sell your personal information
• We do not share personal information for marketing purposes
• External coin pricing services only receive coin data, not personal information
• We do not share information with data brokers or advertisers
```

### **For "Cookies and Tracking" Section:**

```
THIRD-PARTY COOKIES

Our website may use cookies from:
• Authentication providers (Google, GitHub) for sign-in functionality
• Our hosting provider for basic analytics and performance monitoring

We do not use advertising cookies or share data with advertising networks.
```

## 🔍 **Data Flow Summary:**

```
USER PERSONAL DATA FLOW:
├── Supabase (All account data)
├── Google OAuth (Profile during sign-in)
├── GitHub OAuth (Profile during sign-in)
└── Hosting Provider (Technical logs)

COIN DATA FLOW (No Personal Info):
├── Numista API (Coin queries only)
├── PCGS API (Coin queries only)
└── Other APIs (Technical data only)
```

## ✅ **Compliance Checklist:**

- ✅ **Accurate Disclosure**: Only list parties that actually receive personal data
- ✅ **Purpose Limitation**: Clearly state why each party receives data
- ✅ **No Marketing**: Confirm you don't sell data for marketing
- ✅ **User Control**: Mention users can control OAuth permissions
- ✅ **Security**: Note that service providers are contractually bound

## 🎯 **Key Points for Termly.io Setup:**

1. **Primary Category**: Service Providers
2. **Data Sale**: NO - you don't sell personal information
3. **Marketing Disclosure**: NO - no sharing for marketing purposes
4. **Advertising**: NO - no advertising partners receive personal data
5. **Analytics**: Minimal - only basic hosting analytics

## 📞 **If Termly.io Asks Specific Questions:**

**"Do you sell personal information?"** → **NO**

**"Do you share for marketing purposes?"** → **NO**

**"Do you use advertising partners?"** → **NO**

**"Do you share with data brokers?"** → **NO**

**"Do you disclose for analytics?"** → **YES** (minimal hosting analytics only)

**"Do you share with social media platforms?"** → **NO** (OAuth is different from sharing)

## 🔐 **Privacy-First Messaging:**

Your app is actually quite privacy-friendly! You only share data with essential service providers needed for core functionality. This is a strong privacy position that you should highlight.

## 📋 **Action Items:**

1. ✅ Use "Service Providers Only" in Termly.io
2. ✅ Copy the recommended language above
3. ✅ Emphasize that you don't sell data
4. ✅ Note that coin APIs don't receive personal info
5. ✅ Highlight user control over OAuth permissions 