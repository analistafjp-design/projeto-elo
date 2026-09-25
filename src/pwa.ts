const UPDATE_CHECK_INTERVAL_MS = 60 * 1000;

function verificarAtualizacao() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.update());
  });
}

/**
 * O service worker é gerado com registerType "autoUpdate" (skipWaiting +
 * clientsClaim), então assim que uma versão nova é instalada ele assume
 * o controle das abas abertas sozinho, sem esperar todas fecharem. Mas
 * isso NÃO recarrega a página sozinho — o script de registro padrão do
 * vite-plugin-pwa só faz `navigator.serviceWorker.register(...)` e não
 * escuta o evento de troca de controlador, então a aba continua exibindo
 * o JS/CSS antigo já carregado em memória até o usuário atualizar
 * manualmente (era exatamente o "cache preso" que o app apresentava).
 *
 * Aqui fechamos o ciclo: forçamos a checagem de atualização com
 * frequência (o navegador sozinho só verifica esporadicamente, às vezes
 * só a cada 24h) e recarregamos a página automaticamente assim que um
 * novo service worker assume o controle.
 */
export function setupAutoUpdate() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", verificarAtualizacao);
  window.addEventListener("focus", verificarAtualizacao);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") verificarAtualizacao();
  });

  setInterval(verificarAtualizacao, UPDATE_CHECK_INTERVAL_MS);

  // Na primeiríssima instalação do service worker (sem controlador ainda),
  // o "controllerchange" dispara apenas porque o app acabou de ganhar um
  // controlador pela primeira vez — a página já está na versão mais nova,
  // não é uma atualização, então esse primeiro disparo não deve recarregar.
  let jaTinhaControlador = Boolean(navigator.serviceWorker.controller);
  let recarregando = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!jaTinhaControlador) {
      jaTinhaControlador = true;
      return;
    }
    if (recarregando) return;
    recarregando = true;
    window.location.reload();
  });
}
