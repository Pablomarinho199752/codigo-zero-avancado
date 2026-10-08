/* Assistente de ativação App Check para o APK de desenvolvimento.
 * Não insere tokens no código-fonte e não reduz a proteção do Firebase.
 * Não é usado no site publicado: apenas no Capacitor com localhost.
 * NUNCA compartilhar um token de depuração com outras pessoas.
 */
(() => {
  'use strict';
  if (location.hostname !== 'localhost' || !window.Capacitor?.isNativePlatform?.()) return;
  const TOKEN_KEY = 'codigoZeroAndroidDebugToken';
  const STATE_KEY = 'codigoZeroState';
  const CONSOLE_URL = 'https://console.firebase.google.com/project/codigo-zero-avancado/appcheck/apps';
  const COURSE_URL = 'https://pablomarinho199752.github.io/codigo-zero-avancado/';
  const validToken = value =>
    typeof value === 'string' && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);

  const getToken = () => {
    try {
      const value = localStorage.getItem(TOKEN_KEY);
      return validToken(value) ? value : '';
    } catch (_) {
      return '';
    }
  };

  const makeToken = () => {
    if (!crypto?.getRandomValues) throw new Error('Geração segura indisponível neste dispositivo.');
    if (crypto.randomUUID) return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const x = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return x.slice(0,8)+'-'+x.slice(8,12)+'-'+x.slice(12,16)+'-'+x.slice(16,20)+'-'+x.slice(20);
  };

  const installDebugToken = () => {
    const token = getToken();
    if (!token) return;
    // A implementação de App Check no curso usa Firebase JS SDK.
    // O token pré-definido é lido pelo SDK ao inicializar, antes da 1ª chamada.
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = token;
    try {
      const s = JSON.parse(localStorage.getItem(STATE_KEY) || '{}');
      if (s && typeof s === 'object') {
        s.ai = s.ai && typeof s.ai === 'object' ? s.ai : {};
        // Impede que a implementação legada substitua a string pelo booleano true.
        s.ai.debugLocal = false;
        localStorage.setItem(STATE_KEY, JSON.stringify(s));
      }
    } catch (error) {
      console.warn('Não foi possível atualizar o modo App Check local.', error);
    }
  };
  installDebugToken();

  function createGuide(panel) {
    if (panel.querySelector('#codigoZeroNativeAppCheckGuide')) return;
    const holder = document.createElement('aside');
    holder.id = 'codigoZeroNativeAppCheckGuide';
    holder.className = 'native-appcheck-guide';
    const heading = document.createElement('strong');
    heading.textContent = 'Gemini no APK de teste (App Check)';
    const intro = document.createElement('p');
    intro.textContent = 'O APK roda em localhost e não recebe um token reCAPTCHA de produção válido. Para testar a IA neste aparelho, autorize um token de depuração privado no Firebase.';
    holder.append(heading, intro);

    const token = getToken();
    if (!token) {
      const btn = document.createElement('button');
      btn.className = 'ghost';
      btn.type = 'button';
      btn.textContent = '1. Gerar token de teste deste aparelho';
      btn.onclick = () => {
        try {
          localStorage.setItem(TOKEN_KEY, makeToken());
          location.reload();
        } catch (error) {
          alert('Não foi possível gerar o token: ' + String(error?.message || error));
        }
      };
      holder.append(btn);
    } else {
      const label = document.createElement('p');
      label.textContent = '1. Copie este token privado. Não publique nem envie para outras pessoas.';
      const field = document.createElement('input');
      field.className = 'pro-input native-appcheck-token';
      field.readOnly = true;
      field.setAttribute('aria-label', 'Token de depuração privado do APK');
      field.value = token;
      const copyBtn = document.createElement('button');
      copyBtn.className = 'ghost';
      copyBtn.textContent = 'Copiar meu token';
      copyBtn.type = 'button';
      copyBtn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(token);
          copyBtn.textContent = 'Copiado!';
        } catch (_) {
          field.focus();
          field.select();
          copyBtn.textContent = 'Selecione e copie o token';
        }
      };
      holder.append(label, field, copyBtn);
    }

    const instructions = document.createElement('p');
    instructions.textContent = '2. No Firebase, abra App Check → Apps → Código Zero Web PWA → ⋮ → Gerenciar tokens de depuração. Adicione o token como "Meu APK de teste". Depois volte aqui e use o Tutor Gemini.';
    holder.append(instructions);

    const a = document.createElement('a');
    a.href = CONSOLE_URL;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = 'Abrir App Check do Firebase';
    const b = document.createElement('a');
    b.href = COURSE_URL;
    b.target = '_blank';
    b.rel = 'noopener noreferrer';
    b.textContent = 'Usar o curso online no navegador';
    const links = document.createElement('div');
    links.className = 'native-appcheck-links';
    links.append(a,b);
    holder.append(links);

    const note = document.createElement('small');
    note.textContent = 'Somente para depuração pessoal deste APK. Em uma versão Android distribuída, será necessário registrar um app Android com Play Integrity. Nunca adicione localhost ao reCAPTCHA de produção.';
    holder.append(note);
    panel.prepend(holder);
  }

  const findPanel = () => {
    const panel = document.querySelector('#tutorPanel');
    if (!panel) return false;
    createGuide(panel);
    const observer = new MutationObserver(() => {
      if (!panel.querySelector('#codigoZeroNativeAppCheckGuide')) createGuide(panel);
    });
    observer.observe(panel, { childList: true });
    return true;
  };
  if (!findPanel()) {
    const observer = new MutationObserver(() => {
      if (findPanel()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
