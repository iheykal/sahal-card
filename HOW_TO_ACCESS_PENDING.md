# How to Access Pending Customers Tab

## The Issue
You're currently logged in as a **MARKETER** (phone: +25261xxxxxxx).
The Pending Customers tab is ONLY visible in the **SuperAdmin Dashboard**.

## Solution

### Log in as SuperAdmin:

1. **Log out** from the current marketer account
2. **Log in** with a SuperAdmin phone number (NOT starting with +25261)
   - Example: +252612345678 (any phone that doesn't start with +25261)
   - Use your superadmin password

### Once logged in as SuperAdmin:
1. You'll see the SuperAdmin Dashboard
2. Click the **"Pending"** tab (between "Users" and "Marketers")
3. You'll see all pending customer submissions from marketers
4. Approve or reject them with the buttons

### To Test the Full Flow:

**Step 1 - As Marketer (+25261xxxxxxx):**
- Log in as marketer
- Add a new customer
- Log out

**Step 2 - As SuperAdmin (+252xxxxxxxxx - NOT 61):**
- Log in as superadmin
- Go to "Pending" tab
- You should see the customer the marketer added
- Click "Approve" to create the customer and award $0.40 commission

## Current Error Explained:
The console shows:
- `MarketerDashboardPage.tsx` - You're on marketer dashboard
- `403 Forbidden` - Marketer doesn't have access to view all pending customers

Marketers can only see THEIR OWN pending customers in their dashboard.
SuperAdmin can see ALL pending customers from ALL marketers in the Pending tab.
