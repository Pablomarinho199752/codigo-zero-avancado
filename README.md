# Código Zero → Avançado — Edição Completa 2.0

Repositório **único e oficial** do aplicativo de ensino Código Zero. O aplicativo agora começa com uma trilha preparatória realmente acessível a quem nunca programou. O curso técnico original de 96 aulas, matemática e Tutor Gemini foi preservado no mesmo repositório.

## Começar do zero absoluto (novidade)

A página principal agora abre **79 microaulas em 11 módulos**, com:
- explicação simples, situação do cotidiano e exemplo explicado **antes** do exercício;
- uma pergunta por vez, dica progressiva e correção com explicação;
- atividades práticas de escrita de código em etapas selecionadas;
- matemática básica antes de resto e conversão binária;
- progressão por domínio: é preciso acertar a pergunta e concluir a prática, quando houver;
- resumos próprios por aula, progresso local, exportação e importação de segurança;
- letras ajustáveis, tema claro/escuro, interface para celular e consulta a vídeos em português.

**Limitação pedagógica:** a atividade de código da trilha inicial confere partes essenciais do texto, mas **não executa Python e não garante que o programa esteja correto**. O laboratório prático avançado permanece no curso original. Concluir não garante automaticamente nível profissional; os projetos e a experiência são indispensáveis.

- **Comece aqui:** https://pablomarinho199752.github.io/codigo-zero-avancado/
- **Curso técnico original de 96 aulas, laboratório e Tutor Gemini:** https://pablomarinho199752.github.io/codigo-zero-avancado/curso-completo.html

O Tutor Gemini continua dependendo da configuração Firebase e da conexão à internet. Na trilha inicial, o botão **Copiar contexto e abrir Tutor IA** ajuda a transferir a pergunta ao curso completo, mas ainda exige que o aluno cole a mensagem.

## Sincronizar o progresso entre celular e computador

A trilha de 79 microaulas tem sincronização pela nuvem com Firebase Authentication e Cloud Firestore. O progresso local continua funcionando sem login ou internet; a sincronização exige que o usuário entre com **a mesma conta** nos aparelhos.

### Ativação única no Firebase (não é necessário ativar faturamento)

1. Abra [Authentication no projeto Código Zero](https://console.firebase.google.com/project/codigo-zero-avancado/authentication/providers).
2. Em **Sign-in method / Método de login**, habilite **E-mail/senha** e salve.
3. Abra [Cloud Firestore](https://console.firebase.google.com/project/codigo-zero-avancado/firestore). Se ainda não existir banco, crie-o em **Production mode / Modo de produção**. Selecione a região **southamerica-east1 (São Paulo)** se estiver disponível; a região do banco não pode ser alterada depois.
4. Na aba **Rules / Regras**, publique o conteúdo do arquivo [firestore.rules](./firestore.rules). As regras permitem que cada conta leia e altere apenas o próprio documento de progresso.
5. Não mude o projeto para Blaze nem adicione faturamento para esta configuração. Mantenha-se no Spark e dentro das cotas gratuitas.

### Usar em dois aparelhos

1. No celular onde está o progresso antigo, abra o Código Zero e toque em **☁ Conta**.
2. Toque em **Criar conta para sincronizar**, usando um e-mail seu e uma senha nova (mínimo 6 caracteres). O progresso que já está no aparelho será combinado com a nuvem.
3. No computador, abra o mesmo curso, toque em **☁ Conta** e escolha **Entrar e sincronizar** com o mesmo e-mail e senha.
4. Aguarde a mensagem **Sincronizado na nuvem**. A sincronização automática inclui aulas concluídas, respostas, tentativas, rascunhos e resumos. Ela também acompanha alterações feitas no outro aparelho quando há internet.

**Importante:** a senha do ChatGPT não deve ser usada. A senha da conta de sincronização é enviada ao Firebase Authentication e não é guardada pelo curso. O progresso local não é apagado ao sair da conta. A primeira sincronização combina os dados dos aparelhos; mantenha uma exportação de segurança antes de trocar de conta.

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

- `index.html`, `zero.css`, `app-zero.js`, `aulas-zero-1.js`, `aulas-zero-2.js`: trilha preparatória de 79 microaulas.
- `curso-completo.html`, `styles.css`, `pro.css`: interface original preservada.
- `bootstrap.js`, `payload/code-*.txt`: curso técnico original de 96 aulas, exercícios e Tutor Gemini.
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

## Verificações de integridade

Execute `node --check app-zero.js` e `node tests/verify-zero.mjs`. A Action do Android faz essas verificações automaticamente antes de produzir o APK. Os arquivos de origem e o progresso do curso antigo permanecem separados e não são apagados.
