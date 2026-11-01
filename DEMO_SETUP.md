# Demo setup — get past auth & seed data

## 1. Unblock sign-in / register

The error `auth/invalid-credential` on **Sign In** means wrong password or no account yet.

1. Open https://skill-share-azure.vercel.app/register (or locally `/register`).
2. Create an account with name, email, and password (6+ chars).
3. If you already have an account and forgot the password:
   - Go to [Firebase Console → Authentication → Users](https://console.firebase.google.com/project/skill-share-fdfb1/authentication/users)
   - Reset the password, or delete the user and register again.
4. Confirm **Email/Password** is enabled under Authentication → Sign-in method.
5. Confirm authorized domains include `localhost` and `skill-share-azure.vercel.app`.

## 2. Seed demo users (recommended for Loom)

From the project root (after `npm install`):

```bash
node scripts/seedDemo.js
```

This creates two accounts with profiles, an accepted request, an active session, and a starter chat message:

| Email | Password |
|-------|----------|
| `demo.teacher@skillshare.app` | `DemoPass123!` |
| `demo.learner@skillshare.app` | `DemoPass123!` |

Sign in as one account in your recording browser; use the other in incognito if you need to show accept-request live.

**Manual alternative:** register two of your own emails, fill Profile skills, send/accept a request, then open Chats.

## 3. Deploy Firestore indexes & rules

```bash
firebase login
firebase use skill-share-fdfb1
firebase deploy --only firestore:indexes,firestore:rules
```

Indexes can take a few minutes to build. Until then, Requests/Chats show a clear error instead of hanging forever.

You can also open the index URL printed in the browser console when a query fails (`failed-precondition`) and click **Create index**.
