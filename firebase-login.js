// Login com Google e gravação das respostas no Firestore (só no site do GitHub Pages).
import { FIREBASE_CONFIG } from "./firebase-config.js";

const V = "10.12.2";
if (FIREBASE_CONFIG.apiKey && window.rd2Attach) {
  const [{ initializeApp }, A, F] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`)
  ]);
  const app = initializeApp(FIREBASE_CONFIG);
  const auth = A.getAuth(app);
  const db = F.getFirestore(app);
  const provider = new A.GoogleAuthProvider();

  window.RD2_FIREBASE = {
    login: () => A.signInWithPopup(auth, provider).catch(e => {
      if (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment") A.signInWithRedirect(auth, provider);
      else if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request") alert("Não foi possível entrar: " + e.code);
    }),
    logout: () => A.signOut(auth)
  };
  window.rd2Detach(); // mostra os botões de login

  A.onAuthStateChanged(auth, user => {
    if (!user) { window.rd2Detach(); return; }
    const base = ["users", user.uid];
    window.rd2Attach({
      save: r => F.setDoc(F.doc(db, ...base, "tentativas", r.id), r),
      saveEstado: e => F.setDoc(F.doc(db, ...base, "meta", "estado"), e),
      load: async () => {
        const [snap, est] = await Promise.all([
          F.getDocs(F.collection(db, ...base, "tentativas")),
          F.getDoc(F.doc(db, ...base, "meta", "estado"))
        ]);
        return { attempts: snap.docs.map(d => d.data()), estado: est.exists() ? est.data() : null };
      }
    }, user.email || user.displayName || "");
  });
}
