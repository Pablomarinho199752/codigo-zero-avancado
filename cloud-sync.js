/* Sincronização segura da trilha inicial Código Zero.
 * Firebase Authentication (e-mail/senha) + Cloud Firestore.
 * O progresso local continua funcionando se não houver internet ou login.
 */
(() => {
  'use strict';
  const CONFIG = Object.freeze({
    apiKey: 'AIzaSyB1I_ko3CZyVYyQk_Fz76qD5Ywi2VfWgtg',
    authDomain: 'codigo-zero-avancado.firebaseapp.com',
    projectId: 'codigo-zero-avancado',
    storageBucket: 'codigo-zero-avancado.firebasestorage.app',
    messagingSenderId: '901795657238',
    appId: '1:901795657238:web:482c24f02c1d5924fde737'
  });
  const OWNER_KEY = 'codigoZeroFundamentalsCloudOwner';
  const $ = id => document.getElementById(id);
  let auth = null, db = null, currentUser = null, unsubscribeDoc = null;
  let ready = false, applyingRemote = false, writeTimer = 0, pendingState = null, sessionToken = 0;
  let lastError = '', sdkPromise = null;

  function status(message, kind) {
    const node = $('syncStatus');
    if (node) {
      node.textContent = message;
      node.className = 'sync-status' + (kind ? ' ' + kind : '');
    }
    const button = $('syncBtn');
    if (button) {
      button.textContent = currentUser ? '☁ OK' : '☁ Conta';
      button.setAttribute('aria-label', currentUser ? 'Conta conectada; abrir sincronização' : 'Entrar para sincronizar entre aparelhos');
      button.title = currentUser ? 'Sincronização ativada' : 'Sincronizar celular e computador';
    }
  }

  function openDialog() {
    const dialog = $('syncDialog');
    if (!dialog) return;
    dialog.hidden = false;
    if (!auth) initializeFirebase().catch(error => status(explainError(error), 'error'));
    if (!currentUser) $('syncEmail')?.focus();
  }
  function closeDialog() { if ($('syncDialog')) $('syncDialog').hidden = true; }

  function clone(value) { return JSON.parse(JSON.stringify(value || {})); }
  function timestamp(value) {
    const n = Date.parse(value || '');
    return Number.isFinite(n) ? n : 0;
  }
  function stable(value) {
    if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
    if (value && typeof value === 'object') {
      return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + stable(value[k])).join(',') + '}';
    }
    return JSON.stringify(value);
  }
  function mapOrEmpty(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }
  function mergeStates(localInput, remoteInput) {
    const local = mapOrEmpty(localInput), remote = mapOrEmpty(remoteInput);
    const localTime = timestamp(local.savedAt), remoteTime = timestamp(remote.savedAt);
    const localNewer = localTime >= remoteTime;
    const newer = localNewer ? local : remote;
    const older = localNewer ? remote : local;
    const mergeMap = key => ({ ...mapOrEmpty(older[key]), ...mapOrEmpty(newer[key]) });
    const mergeTrueMap = key => {
      const result = { ...mapOrEmpty(local[key]), ...mapOrEmpty(remote[key]) };
      for (const k of Object.keys(result)) result[k] = Boolean(local[key]?.[k] || remote[key]?.[k]);
      return result;
    };
    const attempts = {};
    for (const k of new Set([...Object.keys(mapOrEmpty(local.attempts)), ...Object.keys(mapOrEmpty(remote.attempts))])) {
      attempts[k] = Math.max(Number(local.attempts?.[k]) || 0, Number(remote.attempts?.[k]) || 0);
    }
    const latestTime = Math.max(localTime, remoteTime);
    return {
      ...remote,
      ...local,
      done: [...new Set([...(Array.isArray(local.done) ? local.done : []), ...(Array.isArray(remote.done) ? remote.done : [])])],
      quiz: mergeTrueMap('quiz'),
      code: mergeTrueMap('code'),
      answers: mergeMap('answers'),
      notes: mergeMap('notes'),
      draft: mergeMap('draft'),
      attempts,
      current: Math.max(Number(local.current) || 0, Number(remote.current) || 0),
      introSeen: Boolean(local.introSeen || remote.introSeen),
      theme: newer.theme === 'dark' ? 'dark' : 'light',
      zoom: Number.isFinite(newer.zoom) ? newer.zoom : 1,
      savedAt: latestTime ? new Date(latestTime).toISOString() : null
    };
  }
  function showSignedIn(user) {
    const form = $('syncForm');
    const actions = $('syncAccountActions');
    if (form) form.hidden = Boolean(user);
    if (actions) actions.hidden = !user;
    if ($('syncAccountLabel')) $('syncAccountLabel').textContent = user ? 'Conta conectada: ' + user.email : '';
  }
  function explainError(error) {
    const code = error && error.code || '';
    if (code === 'auth/operation-not-allowed') return 'O acesso por e-mail/senha ainda não foi ativado no Firebase Authentication.';
    if (code === 'auth/email-already-in-use') return 'Este e-mail já tem conta. Use Entrar em vez de Criar conta.';
    if (code === 'auth/weak-password') return 'Escolha uma senha com pelo menos 6 caracteres.';
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') return 'E-mail ou senha incorretos. Confira os dados ou crie sua conta.';
    if (code === 'auth/invalid-email') return 'Digite um endereço de e-mail válido.';
    if (code === 'firestore/permission-denied') return 'O login funcionou, mas as regras do Firestore ainda não permitem o acesso. Publique as regras seguras do arquivo firestore.rules.';
    if (code === 'firestore/failed-precondition' || code === 'firestore/not-found') return 'O banco Cloud Firestore ainda precisa ser criado no projeto Firebase.';
    if (code === 'unavailable' || code === 'firestore/unavailable') return 'Sem conexão com o Firebase no momento. O progresso continua salvo neste aparelho; tente novamente com internet.';
    return 'Não foi possível sincronizar (' + (code || 'erro desconhecido') + '). O progresso local foi mantido.';
  }

  function progressRef(uid) {
    return db.collection('users').doc(uid).collection('progress').doc('fundamentals');
  }
  async function writeState(ref, state) {
    if (!currentUser || !ready) return;
    const payload = clone(state);
    delete payload.__proto__;
    await ref.set({
      schemaVersion: 1,
      state: payload,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    status('Sincronizado na nuvem. Você pode continuar em outro aparelho.', 'success');
  }
  function queueSave(snapshot) {
    if (!currentUser || !ready || applyingRemote) return;
    pendingState = clone(snapshot);
    if (writeTimer) clearTimeout(writeTimer);
    writeTimer = setTimeout(async () => {
      writeTimer = 0;
      const data = pendingState;
      pendingState = null;
      if (!data || !currentUser || !ready) return;
      try { await writeState(progressRef(currentUser.uid), data); }
      catch (error) { lastError = explainError(error); status(lastError, 'error'); }
    }, 700);
  }

  async function connectUser(user, token) {
    ready = false;
    lastError = '';
    lastError = '';
    if (unsubscribeDoc) { unsubscribeDoc(); unsubscribeDoc = null; }
    if (writeTimer) { clearTimeout(writeTimer); writeTimer = 0; }
    pendingState = null;
    const oldOwner = localStorage.getItem(OWNER_KEY);
    if (oldOwner && oldOwner !== user.uid) {
      lastError = 'Este aparelho já foi vinculado a outra conta. Para evitar misturar dados, use a conta anterior neste aparelho ou exporte o progresso antes de trocar.';
      status(lastError, 'error');
      await auth.signOut();
      return;
    }
    status('Conta conectada. Recuperando e combinando o progresso...', '');
    const ref = progressRef(user.uid);
    try {
      const snap = await ref.get();
      if (token !== sessionToken || !currentUser || currentUser.uid !== user.uid) return;
      const local = window.CodigoZeroFundamentals.getState();
      if (snap.exists && snap.data() && snap.data().state) {
        const remote = snap.data().state;
        const merged = mergeStates(local, remote);
        applyingRemote = true;
        window.CodigoZeroFundamentals.applySyncedState(merged);
        applyingRemote = false;
        ready = true;
        localStorage.setItem(OWNER_KEY, user.uid);
        if (stable(merged) !== stable(remote)) await writeState(ref, merged);
        else status('Progresso recuperado e sincronizado. Pode continuar em outro aparelho.', 'success');
      } else {
        ready = true;
        localStorage.setItem(OWNER_KEY, user.uid);
        await writeState(ref, local);
        status('Primeiro salvamento na nuvem concluído. Este será seu progresso compartilhado.', 'success');
      }
      if (token !== sessionToken) return;
      unsubscribeDoc = ref.onSnapshot(remoteSnap => {
        if (!remoteSnap.exists) return;
        const remoteData = remoteSnap.data() && remoteSnap.data().state;
        if (!remoteData || !currentUser || currentUser.uid !== user.uid || !ready) return;
        const localNow = window.CodigoZeroFundamentals.getState();
        const mergedNow = mergeStates(localNow, remoteData);
        if (stable(mergedNow) !== stable(localNow)) {
          applyingRemote = true;
          window.CodigoZeroFundamentals.applySyncedState(mergedNow);
          applyingRemote = false;
        }
        if (stable(mergedNow) !== stable(remoteData)) queueSave(mergedNow);
        else status('Sincronização ativa · ' + user.email, 'success');
      }, error => {
        lastError = explainError(error);
        status(lastError, 'error');
      });
    } catch (error) {
      applyingRemote = false;
      ready = false;
      lastError = explainError(error);
      status(lastError, 'error');
    }
  }

  async function syncNow() {
    if (!currentUser) { openDialog(); return; }
    status('Conferindo as versões local e da nuvem...', '');
    try {
      const ref = progressRef(currentUser.uid);
      const snap = await ref.get();
      const local = window.CodigoZeroFundamentals.getState();
      const remote = snap.exists && snap.data() ? snap.data().state : null;
      const merged = remote ? mergeStates(local, remote) : local;
      applyingRemote = true;
      window.CodigoZeroFundamentals.applySyncedState(merged);
      applyingRemote = false;
      await writeState(ref, merged);
    } catch (error) {
      applyingRemote = false;
      status(explainError(error), 'error');
    }
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = [...document.scripts].find(s => s.src === src);
      if (existing && existing.dataset.loaded === 'true') { resolve(); return; }
      const script = existing || document.createElement('script');
      script.src = src;
      script.async = false;
      script.onload = () => { script.dataset.loaded = 'true'; resolve(); };
      script.onerror = () => reject(new Error('Falha ao carregar o SDK Firebase.'));
      if (!existing) document.head.appendChild(script);
    });
  }
  async function initializeFirebase() {
    if (auth && db) return;
    if (sdkPromise) return sdkPromise;
    sdkPromise = (async () => {
      const base = 'https://www.gstatic.com/firebasejs/11.10.0/';
      if (!window.firebase || !firebase.initializeApp) await loadScript(base + 'firebase-app-compat.js');
      if (!window.firebase || !firebase.auth) await loadScript(base + 'firebase-auth-compat.js');
      if (!window.firebase || !firebase.firestore) await loadScript(base + 'firebase-firestore-compat.js');
      if (!window.firebase || !firebase.initializeApp) throw new Error('O SDK Firebase não ficou disponível.');
      const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(CONFIG);
      auth = app.auth();
      db = app.firestore();
      await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      auth.onAuthStateChanged(user => {
        currentUser = user || null;
        ready = false;
        sessionToken++;
        const token = sessionToken;
        showSignedIn(currentUser);
        if (!currentUser) {
          if (unsubscribeDoc) { unsubscribeDoc(); unsubscribeDoc = null; }
          status(lastError || 'Entre com o mesmo e-mail e senha no celular e no computador para compartilhar o progresso.', lastError ? 'error' : '');
          return;
        }
        connectUser(currentUser, token);
      });
    })();
    try { await sdkPromise; }
    catch (error) { sdkPromise = null; throw error; }
  }

  function init() {
    if (!$('syncBtn')) return;
    $('syncBtn').addEventListener('click', openDialog);
    $('syncCloseBtn')?.addEventListener('click', closeDialog);
    $('syncDialog')?.addEventListener('click', event => { if (event.target === $('syncDialog')) closeDialog(); });
    $('syncForm')?.addEventListener('submit', async event => {
      event.preventDefault();
      if (!auth) { status('O Firebase não carregou. Conecte à internet e atualize a página.', 'error'); return; }
      const email = $('syncEmail').value.trim();
      const password = $('syncPassword').value;
      if (!email || !password) { status('Digite seu e-mail e senha.', 'error'); return; }
      status('Entrando...', '');
      try {
        await auth.signInWithEmailAndPassword(email, password);
        $('syncPassword').value = '';
      } catch (error) { status(explainError(error), 'error'); }
    });
    $('createAccountBtn')?.addEventListener('click', async () => {
      if (!auth) { status('O Firebase não carregou. Conecte à internet e atualize a página.', 'error'); return; }
      const email = $('syncEmail').value.trim();
      const password = $('syncPassword').value;
      if (!email || !password) { status('Digite o e-mail e crie uma senha com pelo menos 6 caracteres.', 'error'); return; }
      status('Criando sua conta...', '');
      try {
        await auth.createUserWithEmailAndPassword(email, password);
        $('syncPassword').value = '';
      } catch (error) { status(explainError(error), 'error'); }
    });
    $('syncNowBtn')?.addEventListener('click', syncNow);
    $('signOutBtn')?.addEventListener('click', async () => {
      if (!auth) return;
      if (!window.confirm('Sair da conta neste aparelho? O progresso local continuará salvo.')) return;
      ready = false;
      if (unsubscribeDoc) { unsubscribeDoc(); unsubscribeDoc = null; }
      await auth.signOut();
      status('Você saiu. O progresso continua salvo localmente neste aparelho.', '');
    });
    $('syncBtn').setAttribute('aria-haspopup', 'dialog');

    status('Preparando sincronização. O curso já funciona; o login na nuvem carrega em segundo plano.', '');
    initializeFirebase().catch(error => {
      status('Não foi possível carregar o Firebase. O progresso local continua funcionando; conecte à internet e toque em Conta para tentar de novo.', 'error');
    });
  }

  window.CodigoZeroCloudSync = Object.freeze({ queueSave, openDialog, syncNow, mergeStates });
  init();
})();