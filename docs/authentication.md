# Local Authentication System

This application now uses a simple local authentication system built with:

- `iron-session` for encrypted session cookies
- Plain text password storage for development simplicity
- Next.js middleware for route protection

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Local Authentication
SESSION_SECRET="your-very-strong-secret-password-for-cookies-at-least-32-characters-long"
LOCAL_ADMIN_USERNAME="admin"
LOCAL_ADMIN_PASSWORD="langstrasse125"
```

### Default Credentials

- **Username**: `admin`
- **Password**: `langstrasse125`

## Features

- **Session Management**: Secure 7-day sessions with encrypted cookies
- **Route Protection**: Middleware automatically redirects unauthenticated users to login
- **Password Security**: Plain text password storage for development simplicity
- **Modern UI**: Clean login form with error handling and loading states

## Usage

1. Visit any protected route (e.g., `/`)
2. You'll be redirected to `/login`
3. Enter credentials: `admin` / `langstrasse125`
4. You'll be redirected back to the main application
5. Use the logout button in the header to sign out

## Security Notes

- The `SESSION_SECRET` should be a strong, random string (at least 32 characters)
- In production, always use HTTPS for secure cookie transmission
- **Important**: Passwords are stored in plain text in the `.env` file for development simplicity
- Ensure `.env` files are never committed to version control and have appropriate file permissions
- Sessions automatically expire after 7 days

## Changing Password

To change the password, simply update the `LOCAL_ADMIN_PASSWORD` value in your `.env` file and restart the development server.
