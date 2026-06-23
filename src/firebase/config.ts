import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDQVFjGUOXQtjz0AgjCZ9RivBbUOhfPeag',
  authDomain: 'tageswerk.firebaseapp.com',
  projectId: 'tageswerk',
  storageBucket: 'tageswerk.firebasestorage.app',
  messagingSenderId: '964432660404',
  appId: '1:964432660404:web:f04c4401ec2a9db35614e1',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
