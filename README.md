# Código Zero → Avançado — Edição Completa 2.0

Repositório **único e oficial** do aplicativo de ensino Código Zero. O curso completo,
com aulas, prática, matemática explicada do zero e Tutor Gemini, está aqui.

## Abrir ou instalar pelo navegador

- [Curso online e PWA](https://pablomarinho199752.github.io/codigo-zero-avancado/)
- No Android: Chrome → menu ⋮ → **Instalar aplicativo** (ou Adicionar à tela inicial).
- No Windows: Chrome ou Edge → opção **Instalar este aplicativo**.

## Gerar o APK para Android via GitHub Actions

O APK é compilado exclusivamente com o conteúdo deste repositório, usando
**Capacitor 8**. Os arquivos do curso ficam incluídos dentro do aplicativo.

1. Abra a aba [Actions](https://github.com/Pablomarinho199752/codigo-zero-avancado/actions).
2. Escolha **Código Zero — Gerar APK Android**.
3. Se for preciso, toque em **Run workflow** → **Run workflow**.
4. Aguarde a execução terminar com marca verde.
5. Entre na execução concluída, desça até **Artifacts** e baixe
   **Codigo-Zero-Avancado-Android-APK**.
6. Extraia o arquivo ZIP e instale `app-debug.apk` no Android,
   autorizando a instalação de apps dessa origem.

**Importante:** o APK produzido é uma **versão de teste (debug)**, não é a
versão assinada de publicação na Play Store. Pode ser necessário desinstalar
um APK debug antigo antes de instalar outro, pois a assinatura poderá mudar.
Exporte seu progresso antes de desinstalar.

## Estrutura principal

- `index.html`, `styles.css`, `pro.css`: interface.
- `bootstrap.js`, `payload/code-*.txt`: aulas, exercícios e tutor.
- `firebase-tutor-setup.js`: configuração Web pública Firebase/App Check.
- `assets/`: ícones do aplicativo.
- `manifest.webmanifest`, `sw.js`: instalação PWA e funcionamento offline.
- `scripts/build-android-web.mjs`: cópia local dos arquivos para o Android.
- `.github/workflows/android-apk.yml`: Action de build de APK.
- `CONFIGURAR-TUTOR-GEMINI.md`: instruções de diagnóstico do Tutor.

O **Tutor Gemini exige internet**. No APK, o App Check pode precisar de
configuração específica para o WebView Android; valide uma pergunta real após
instalar. O restante do curso funciona com os arquivos embarcados no APK.

## Segurança e custos

O Firebase `codigo-zero-avancado` foi visto no plano **Spark** em 08/10/2026.
Nenhum comando deste repositório ativa faturamento. As chaves aqui são
configurações Web públicas; não adicione senhas ou chaves privadas.

## Tutor IA no APK Android de teste (401 App Check)

O APK Capacitor executa as aulas em `https://localhost`, que não é um
endereço autorizado para a chave reCAPTCHA de produção. **Não adicione localhost
à chave reCAPTCHA Web.** No APK de depuração existe um assistente na aba Tutor IA
para gerar um token particular desse aparelho e cadastrá-lo em:

Firebase Console → App Check → Apps → Código Zero Web PWA → menu ⋮ →
**Gerenciar tokens de depuração** → Adicionar.

1. Instale o APK de teste, abra Tutor IA e toque **Gerar token de teste deste aparelho**.
2. O aplicativo recarrega; abra Tutor IA e toque **Copiar meu token**.
3. No Firebase, registre esse token com nome **Meu APK de teste**.
4. Volte ao APK e teste a resposta Gemini.

**Segurança:** não compartilhe nem faça commit do token; ele concede
acesso a partir de um dispositivo não verificado. Esse método é apenas
para testar no seu próprio aparelho, não para distribuição pública. Para
publicar o Android de verdade, registre um aplicativo Android no Firebase e
implemente App Check com Play Integrity e assinatura estável.
