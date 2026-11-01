/**
 * Seeds two demo accounts + an accepted skill session for Loom demos.
 *
 * Usage (from project root):
 *   node scripts/seedDemo.js
 *
 * Then sign in as either:
 *   demo.teacher@skillshare.app / DemoPass123!
 *   demo.learner@skillshare.app / DemoPass123!
 *
 * If accounts already exist, profiles/session are still upserted where possible.
 */

const { initializeApp } = require('firebase/app');
const {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut
} = require('firebase/auth');
const {
  getFirestore,
  doc,
  setDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp
} = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyCKr0lXUemGmAJ4w4zUZW5wPa2_gmRkNWo',
  authDomain: 'skill-share-fdfb1.firebaseapp.com',
  projectId: 'skill-share-fdfb1',
  storageBucket: 'skill-share-fdfb1.firebasestorage.app',
  messagingSenderId: '1049995999682',
  appId: '1:1049995999682:web:fe1ee5ef40aa15e386be5b'
};

const DEMO_PASSWORD = 'DemoPass123!';

const teacher = {
  email: 'demo.teacher@skillshare.app',
  displayName: 'Alex Teacher',
  teachSkills: ['Guitar', 'Music Theory'],
  learnSkills: ['React', 'Web Design'],
  profession: 'Musician',
  bio: 'Happy to trade guitar lessons for coding help.'
};

const learner = {
  email: 'demo.learner@skillshare.app',
  displayName: 'Sam Learner',
  teachSkills: ['React', 'JavaScript'],
  learnSkills: ['Guitar', 'Songwriting'],
  profession: 'Frontend Developer',
  bio: 'Looking to learn guitar in exchange for React mentoring.'
};

async function ensureAuthUser(auth, account) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, account.email, DEMO_PASSWORD);
    await updateProfile(cred.user, { displayName: account.displayName });
    console.log(`Created auth user: ${account.email}`);
    return cred.user;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      const cred = await signInWithEmailAndPassword(auth, account.email, DEMO_PASSWORD);
      console.log(`Signed in existing user: ${account.email}`);
      return cred.user;
    }
    throw error;
  }
}

async function upsertProfile(db, user, account) {
  const userData = {
    uid: user.uid,
    email: account.email,
    displayName: account.displayName,
    photoURL: '',
    bio: account.bio,
    teachSkills: account.teachSkills,
    learnSkills: account.learnSkills,
    location: 'Remote',
    profession: account.profession,
    languages: ['English'],
    experience: 'Intermediate',
    socialLinks: { linkedin: '', github: '', twitter: '' },
    createdAt: new Date(),
    lastUpdated: new Date()
  };
  await setDoc(doc(db, 'users', user.uid), userData, { merge: true });
  console.log(`Upserted profile: ${account.displayName}`);
  return userData;
}

async function ensureSession(db, teacherUser, learnerUser) {
  // Query as the signed-in learner only — rules require auth.uid in participants.
  const sessionsRef = collection(db, 'skillSessions');
  const existing = query(
    sessionsRef,
    where('participants', 'array-contains', learnerUser.uid),
    where('status', '==', 'active')
  );
  const snap = await getDocs(existing);
  const already = snap.docs.find((d) => {
    const participants = d.data().participants || [];
    return participants.includes(teacherUser.uid);
  });

  if (already) {
    console.log(`Active session already exists: ${already.id}`);
    return already.id;
  }

  const sessionDoc = await addDoc(sessionsRef, {
    participants: [teacherUser.uid, learnerUser.uid],
    teacherUserId: teacherUser.uid,
    learnerUserId: learnerUser.uid,
    teacherName: teacher.displayName,
    learnerName: learner.displayName,
    skillOffered: 'Guitar',
    skillRequested: 'React',
    status: 'active',
    createdAt: new Date(),
    lastUpdated: new Date()
  });
  console.log(`Created skill session: ${sessionDoc.id}`);

  // senderId must match the signed-in user (learner) per firestore.rules
  await addDoc(collection(db, 'messages'), {
    sessionId: sessionDoc.id,
    senderId: learnerUser.uid,
    senderName: learner.displayName,
    text: 'Hey Alex! Excited to trade React for Guitar. When works for you?',
    timestamp: serverTimestamp(),
    createdAt: new Date()
  });
  console.log('Seeded welcome message');

  await addDoc(collection(db, 'skillRequests'), {
    from_user: learnerUser.uid,
    from_user_name: learner.displayName,
    to_user: teacherUser.uid,
    to_user_name: teacher.displayName,
    skill_requested: 'Guitar',
    skill_offered: 'React',
    status: 'accepted',
    createdAt: new Date(),
    lastUpdated: new Date(),
    respondedAt: new Date()
  });
  console.log('Seeded accepted skill request');

  return sessionDoc.id;
}

async function main() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  console.log('Seeding demo data for skill-share-fdfb1...\n');

  const teacherUser = await ensureAuthUser(auth, teacher);
  await upsertProfile(db, teacherUser, teacher);
  await signOut(auth);

  const learnerUser = await ensureAuthUser(auth, learner);
  await upsertProfile(db, learnerUser, learner);

  // Need both users authenticated context for writes — signed in as learner;
  // session create rule allows any authenticated user.
  await ensureSession(db, teacherUser, learnerUser);
  await signOut(auth);

  console.log('\nDemo seed complete. Sign in with either:');
  console.log(`  ${teacher.email} / ${DEMO_PASSWORD}`);
  console.log(`  ${learner.email} / ${DEMO_PASSWORD}`);
  console.log('\nBrowse → Requests → Chats should show partner data.');
}

main().catch((error) => {
  console.error('\nSeed failed:', error.code || '', error.message);
  if (error.code === 'auth/operation-not-allowed') {
    console.error('Enable Email/Password in Firebase Console → Authentication → Sign-in method.');
  }
  if (error.code === 'permission-denied') {
    console.error('Deploy firestore.rules, then re-run this script while signed in as a demo user.');
  }
  process.exit(1);
});
