# Role-Based Routing Implementation

## Overview
Implemented industry-standard role-based routing solution using **Protected Routes** and **React Context** to fix the critical routing bug where users were seeing content from the wrong role.

## Problem Identified
- Brand users were seeing Group Admin content
- Group Admin users were seeing Brand content  
- Helper functions (`getGroupsElement()`, `getWalletElement()`) were being called at module load time, not on each render
- localStorage changes didn't trigger re-renders
- Role checks happened at the wrong time in component lifecycle

## Solution Implemented

### 1. **AuthContext** (`client/src/context/AuthContext.jsx`)
Created a React Context to manage user authentication state globally:
- Loads user from localStorage on app mount
- Provides `login()`, `logout()`, `updateUser()` methods
- Exposes `user` object and `loading` state to all components
- Ensures user state is reactive and triggers re-renders

**Benefits:**
- Centralized user state management
- Automatic re-renders when user data changes
- Eliminates repeated localStorage parsing across components

### 2. **ProtectedRoute Component** (`client/src/components/ProtectedRoute.jsx`)
A wrapper component that enforces role-based access control:
- Checks authentication status on each render
- Validates user role against `allowedRoles` prop
- Redirects unauthorized users appropriately
- Shows loading state while checking authentication

**Usage:**
```jsx
<ProtectedRoute 
  element={<Groups />} 
  allowedRoles="GA" // Single role
/>

<ProtectedRoute 
  element={<Settings />} 
  allowedRoles={["GA", "BR"]} // Multiple roles
/>
```

### 3. **RoleDashboard Component** (`client/src/components/RoleDashboard.jsx`)
Dynamic component selector for dashboard home page:
- Renders `BrandHome` for BR users
- Renders `GroupAdminHome` for GA users
- Updates automatically when role changes (via AuthContext)

### 4. **Updated App.jsx**
Complete routing restructure with proper role protection:

**Route Structure:**
```
/dashboard (Protected - GA & BR)
  ├── / (index) → RoleDashboard (role-aware)
  │
  ├── Group Admin Routes (GA only):
  │   ├── /groups
  │   ├── /wallet
  │   └── /subscriptions
  │
  ├── Brand Routes (BR only):
  │   ├── /brand/groups
  │   ├── /brand/wallet
  │   └── /brand/saved
  │
  └── Shared Routes (GA & BR):
      └── /settings
```

**Key Changes:**
- Removed helper functions (`getGroupsElement`, `getWalletElement`)
- Removed inline localStorage checks in JSX
- Wrapped all routes with `ProtectedRoute` component
- Brand routes now use `/brand/` prefix for clear separation
- Each route specifies `allowedRoles` explicitly

### 5. **Updated Components**

#### **Sidebar.jsx**
- Uses `useAuth()` hook instead of localStorage directly
- Brand links updated to match new route structure:
  - `/dashboard/brand/groups`
  - `/dashboard/brand/wallet`
  - `/dashboard/brand/saved`
- Uses AuthContext's `logout()` method

#### **Login.jsx**
- Uses `login()` from AuthContext after successful authentication
- Maintains reactive user state

#### **SelectRole.jsx**
- Uses `login()` from AuthContext after role selection
- Ensures user state is properly initialized

#### **Settings.jsx**
- Uses `useAuth()` to access user data
- Uses `updateUser()` to update user profile
- No longer directly manipulates localStorage

## Technical Benefits

### 1. **Proper React Patterns**
- Uses hooks and context for state management
- Components re-render when user state changes
- Follows React best practices

### 2. **Security**
- Every route explicitly declares allowed roles
- Protection happens at route level, not component level
- Unauthorized access attempts redirect appropriately

### 3. **Maintainability**
- Single source of truth for user state (AuthContext)
- Clear separation of concerns
- Easy to add new role-based routes
- Self-documenting code (role requirements visible in routes)

### 4. **Scalability**
- Easy to add more roles (just update `allowedRoles`)
- Can add permission-based access alongside roles
- Context can be extended with more auth features

## Testing the Fix

### As Group Admin (GA):
1. Login with GA account
2. Should see `/dashboard` with Group Admin home
3. Sidebar shows: Dashboard, My Groups, Wallet, Subscriptions, Settings
4. Can access: `/dashboard/groups`, `/dashboard/wallet`, `/dashboard/subscriptions`
5. Cannot access: `/dashboard/brand/*` routes (redirects to dashboard)

### As Brand (BR):
1. Login with Brand account
2. Should see `/dashboard` with Brand home
3. Sidebar shows: Dashboard, Groups, Saved, Campaigns, Wallet, Settings
4. Can access: `/dashboard/brand/groups`, `/dashboard/brand/wallet`, `/dashboard/brand/saved`
5. Cannot access: GA-only routes like `/dashboard/subscriptions` (redirects to dashboard)

### Shared Access:
- Both roles can access `/dashboard/settings`
- Both see their appropriate dashboard at `/dashboard` index

## Files Modified

### Created:
- `client/src/context/AuthContext.jsx` - Authentication context provider
- `client/src/components/ProtectedRoute.jsx` - Route protection component
- `client/src/components/RoleDashboard.jsx` - Role-aware dashboard selector

### Updated:
- `client/src/App.jsx` - Complete routing restructure
- `client/src/components/Sidebar.jsx` - AuthContext integration, route updates
- `client/src/pages/Login.jsx` - AuthContext integration
- `client/src/pages/SelectRole.jsx` - AuthContext integration
- `client/src/pages/group-admin/Settings.jsx` - AuthContext integration

## Migration Notes

### For Future Development:

1. **Adding a new role-protected route:**
   ```jsx
   <Route 
     path="new-page" 
     element={<ProtectedRoute element={<NewPage />} allowedRoles="GA" />} 
   />
   ```

2. **Accessing user in components:**
   ```jsx
   import { useAuth } from '../context/AuthContext';
   
   const MyComponent = () => {
     const { user, loading } = useAuth();
     
     if (loading) return <div>Loading...</div>;
     if (!user) return <div>Not authenticated</div>;
     
     return <div>Hello {user.name}</div>;
   };
   ```

3. **Updating user data:**
   ```jsx
   const { user, updateUser } = useAuth();
   
   const handleUpdate = async () => {
     const response = await api.put('/profile', data);
     updateUser({ ...user, ...data }); // Updates context + localStorage
   };
   ```

## Conclusion

This implementation follows industry-standard patterns used in production React applications:
- **React Context** for global state (similar to Redux but simpler)
- **Higher-Order Components** (ProtectedRoute) for cross-cutting concerns
- **Declarative routing** with explicit permission requirements
- **Single source of truth** for authentication state

The routing bug is now fixed because:
1. User state is reactive (AuthContext)
2. Role checks happen on each render (ProtectedRoute)
3. Route protection is explicit and declarative
4. No stale closures or module-load-time checks
