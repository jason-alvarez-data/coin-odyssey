# Data Retention Policy Guide - Coin Odyssey

## 🎯 For Your Termly.io Privacy Policy

**Question:** "How long will you keep the information that you've collected from your users?"

**Recommended Answer:** **"Based on account activity and legal requirements"**

## 📝 **Recommended Privacy Policy Text:**

```
DATA RETENTION PERIODS

We retain your personal information for different periods depending on the type of data:

ACCOUNT DATA:
• Active accounts: Retained indefinitely while account remains active
• Inactive accounts: Deleted after 3 years of inactivity
• Deleted accounts: All personal data deleted within 30 days of deletion request

COLLECTION DATA:
• Coin collection records: Retained while account is active
• Value history: Retained for up to 7 years for tax/investment tracking purposes
• Images: Deleted immediately when coins are removed or account is deleted

TECHNICAL DATA:
• Login logs: Retained for 90 days for security purposes
• Error logs: Retained for 1 year for troubleshooting
• Usage analytics: Aggregated data retained indefinitely (no personal identifiers)

LEGAL COMPLIANCE:
• Some data may be retained longer if required by law
• Tax-related information retained for 7 years per IRS requirements
• Data required for legal proceedings retained until resolved

USER CONTROL:
• Users can request account deletion at any time
• Users can export their data before deletion
• Users can delete individual coins/collections immediately
```

## 🗂️ **Data Categories & Retention Periods:**

| Data Type | Current Storage | Recommended Retention | Reasoning |
|-----------|----------------|----------------------|-----------|
| **Account Info** | Indefinite | 3 years inactive + 30 days after deletion | Standard practice |
| **Email/Auth** | Indefinite | Same as account | Required for login |
| **Collections** | Indefinite | While account active | User's primary data |
| **Coin Records** | Indefinite | While account active | User's primary data |
| **Value History** | Indefinite | 7 years | Tax/investment tracking |
| **Images** | Indefinite | While coin exists + immediate deletion | Storage costs |
| **Login Logs** | Not tracked | 90 days | Security monitoring |
| **Preferences** | Indefinite | While account active | User experience |

## 🛠️ **Implementation Requirements:**

### **High Priority (For Legal Compliance):**

1. **Account Deletion Feature**
   - Add "Delete Account" button in settings
   - Cascade delete all user data
   - 30-day deletion completion

2. **Data Export Feature**
   - Allow users to download their data
   - Include all collections, coins, and history
   - JSON and CSV formats

3. **Inactive Account Cleanup**
   - Identify accounts inactive for 3+ years
   - Send deletion warning emails
   - Automated cleanup process

### **Medium Priority:**

4. **Enhanced Data Controls**
   - Individual coin/collection deletion
   - Selective data export
   - Privacy dashboard

5. **Audit Trail**
   - Log data deletion events
   - Track retention compliance
   - User consent records

## 💻 **Code Implementation Examples:**

### **1. Account Deletion Function (Add to Settings Page):**

```typescript
const handleDeleteAccount = async () => {
  if (!confirm('This will permanently delete your account and all data. Are you sure?')) {
    return;
  }
  
  try {
    // Delete user data first
    await deleteUserData(user.id);
    
    // Then delete auth account
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    
    if (error) throw error;
    
    // Sign out and redirect
    await supabase.auth.signOut();
    router.push('/');
  } catch (error) {
    console.error('Account deletion failed:', error);
  }
};
```

### **2. Database Cleanup Function:**

```sql
-- Add to your database schema
CREATE OR REPLACE FUNCTION delete_user_data(user_uuid UUID)
RETURNS void AS $$
BEGIN
  -- Delete in reverse dependency order
  DELETE FROM coin_value_history WHERE coin_id IN (
    SELECT c.id FROM coins c 
    JOIN collections col ON c.collection_id = col.id 
    WHERE col.user_id = user_uuid
  );
  
  DELETE FROM coins WHERE collection_id IN (
    SELECT id FROM collections WHERE user_id = user_uuid
  );
  
  DELETE FROM collection_shares WHERE collection_id IN (
    SELECT id FROM collections WHERE user_id = user_uuid
  );
  
  DELETE FROM collections WHERE user_id = user_uuid;
  
  -- Delete storage objects (images)
  DELETE FROM storage.objects WHERE owner = user_uuid;
END;
$$ LANGUAGE plpgsql;
```

### **3. Data Export Function:**

```typescript
const exportUserData = async () => {
  const userData = {
    account: {
      email: user.email,
      created_at: user.created_at,
      exported_at: new Date().toISOString()
    },
    collections: await fetchUserCollections(),
    coins: await fetchUserCoins(),
    preferences: await fetchUserSettings()
  };
  
  const blob = new Blob([JSON.stringify(userData, null, 2)], {
    type: 'application/json'
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `coin-odyssey-data-${Date.now()}.json`;
  a.click();
};
```

## 🎯 **Immediate Actions for Termly.io:**

### **Short-term Answer (Use This Now):**
```
"We retain user information as follows:
- Account data: Retained while account is active
- Collection data: Retained while account is active  
- Users can request account deletion at any time
- Deleted accounts are processed within 30 days
- Some data may be retained longer for legal compliance"
```

### **Long-term Answer (After Implementation):**
```
"We have comprehensive data retention policies:
- Active accounts: Data retained indefinitely
- Inactive accounts: Deleted after 3 years of inactivity
- Deletion requests: Processed within 30 days
- Value history: Retained up to 7 years for tax purposes
- Technical logs: 90 days to 1 year depending on type
- Users have full control over their data including export and deletion"
```

## ✅ **Compliance Checklist:**

- 🔲 **Add Account Deletion Feature**
- 🔲 **Implement Data Export**
- 🔲 **Set Up Automated Cleanup**
- 🔲 **Create Privacy Dashboard**
- 🔲 **Document Retention Periods**
- 🔲 **Update Privacy Policy**
- 🔲 **Test Deletion Process**
- 🔲 **Train Support Team**

## 📞 **Priority Order:**

1. **Week 1**: Update Termly.io with short-term answer
2. **Week 2-3**: Implement account deletion feature
3. **Week 4**: Add data export functionality
4. **Month 2**: Set up automated cleanup processes
5. **Month 3**: Update privacy policy with comprehensive retention policy

## 🎨 **User-Friendly Features:**

- **Data Dashboard**: Show users what data you have
- **Retention Timeline**: Visual timeline of data retention
- **Deletion Countdown**: Show users when inactive account deletion will occur
- **Export History**: Track when users have exported their data 