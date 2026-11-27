import { initializeApp } from "firebase/app"
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyCchQ9P4apXyxm2ZbL9LaNV1yBcdMlJbzc",
  authDomain: "drawingproject-7ed00.firebaseapp.com",
  projectId: "drawingproject-7ed00",
  storageBucket: "drawingproject-7ed00.firebasestorage.app",
  messagingSenderId: "781546504343",
  appId: "1:781546504343:web:a919ad5f7a093d4d2fa9d2",
  measurementId: "G-SV3YN718KL",
}

const app = initializeApp(firebaseConfig)
const appCheckKey = import.meta.env.VITE_APPCHECK_SITE_KEY
if (appCheckKey) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(appCheckKey),
    isTokenAutoRefreshEnabled: true,
  })
}
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
