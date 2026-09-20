/* ==========================================================================
   AZUL PASTEL — script.js
   JS só para: links, menu mobile, abas do cardápio, botão de preços,
   indicador "Aberto agora" e o vídeo do hero. Sem frameworks.
   O site continua legível sem JavaScript (só o botão de preços depende dele).
   ========================================================================== */

/* ---------- 1. CONFIGURAÇÃO (o único lugar para trocar links e horários) ----------
   Cada link do HTML tem data-link="ifood" (ou whatsapp, instagram, mapa).
   O script aplica o valor abaixo em todos eles.
   O HTML traz o mesmo endereço só como reserva, para o caso de o JavaScript estar desligado. */
const CONFIG = {
  links: {
    // Unidade "Azul Pastel [vsp]" (Montanhão) no iFood.
    ifood: "https://www.ifood.com.br/delivery/sao-bernardo-do-campo-sp/azul-pastel-vsp-montanhao",
    whatsapp: "https://api.whatsapp.com/send?phone=551144556280&text=Ol%C3%A1!%20Gostaria%20de%20pedir%20um%20pastel%20%F0%9F%92%99%F0%9F%A9%B5",
    instagram: "https://www.instagram.com/azulpastel_pastelaria/",
    mapa: "https://www.google.com/maps/search/?api=1&query=Av.%20Nelson%20Mandela%2C%20474%20-%20Montanh%C3%A3o%2C%20S%C3%A3o%20Bernardo%20do%20Campo%20-%20SP",
  },

  fusoHorario: "America/Sao_Paulo",

  // Horário por dia da semana (0 = domingo ... 6 = sábado). null = fechado.
  horarios: {
    0: { abre: "11:00", fecha: "22:45" }, // domingo
    1: { abre: "11:00", fecha: "23:00" }, // segunda
    2: null,                              // terça: fechado
    3: { abre: "11:00", fecha: "22:45" }, // quarta
    4: { abre: "11:00", fecha: "22:45" }, // quinta
    5: { abre: "11:00", fecha: "22:45" }, // sexta
    6: { abre: "11:00", fecha: "22:45" }, // sábado
  },
};

const NOMES_DIA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

/* ---------- 2. Links ---------- */
function aplicarLinks() {
  document.querySelectorAll("[data-link]").forEach((el) => {
    const url = CONFIG.links[el.dataset.link];
    if (url) el.setAttribute("href", url);
  });
}

/* ---------- 3. Foto quebrada: bloco azul com o logo ----------
   Chamada pelo onerror das imagens do cardápio. */
window.azulImgFallback = function (img) {
  if (!img || img.dataset.fallback) return;
  img.dataset.fallback = "1";

  const box = document.createElement("div");
  box.className = "img-fallback";
  box.setAttribute("role", "img");
  box.setAttribute("aria-label", img.alt || "Azul Pastel");

  const logo = new Image();
  logo.className = "img-fallback__logo";
  logo.alt = "";
  logo.src = "images/logo-p.png";
  logo.addEventListener("error", () => {
    box.textContent = "Azul Pastel"; // sem o logo, mostra o nome
  });

  box.appendChild(logo);
  img.replaceWith(box);
};

// Imagens que já falharam antes de o script carregar
function varrerImagensQuebradas() {
  document.querySelectorAll("img[onerror]").forEach((img) => {
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) {
      window.azulImgFallback(img);
    }
  });
}

/* ---------- 4. Menu mobile ---------- */
function iniciarMenu() {
  const botao = document.querySelector(".burger");
  const menu = document.getElementById("menu-principal");
  if (!botao || !menu) return;

  const abrir = (aberto) => {
    menu.classList.toggle("is-open", aberto);
    botao.setAttribute("aria-expanded", String(aberto));
    botao.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
  };

  botao.addEventListener("click", () => abrir(botao.getAttribute("aria-expanded") !== "true"));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) abrir(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.classList.contains("is-open")) { abrir(false); botao.focus(); }
  });
  document.addEventListener("click", (e) => {
    if (!menu.classList.contains("is-open")) return;
    if (!menu.contains(e.target) && !botao.contains(e.target)) abrir(false);
  });
}

/* ---------- 5. Abas do cardápio (teclado e leitor de tela) ---------- */
function iniciarAbas() {
  const lista = document.querySelector('.tabs[role="tablist"]');
  if (!lista) return;
  const abas = Array.from(lista.querySelectorAll('[role="tab"]'));

  const ativar = (aba, focar) => {
    abas.forEach((a) => {
      const ativa = a === aba;
      a.setAttribute("aria-selected", String(ativa));
      a.tabIndex = ativa ? 0 : -1;
      const painel = document.getElementById(a.getAttribute("aria-controls"));
      if (painel) painel.hidden = !ativa;
    });
    if (focar) aba.focus();
  };

  abas.forEach((aba, i) => {
    aba.addEventListener("click", () => ativar(aba, false));
    aba.addEventListener("keydown", (e) => {
      let destino = null;
      if (e.key === "ArrowRight") destino = abas[(i + 1) % abas.length];
      else if (e.key === "ArrowLeft") destino = abas[(i - 1 + abas.length) % abas.length];
      else if (e.key === "Home") destino = abas[0];
      else if (e.key === "End") destino = abas[abas.length - 1];
      if (destino) { e.preventDefault(); ativar(destino, true); }
    });
  });

  ativar(abas.find((a) => a.getAttribute("aria-selected") === "true") || abas[0], false);
}

/* ---------- 6. Botão "Mostrar preços / Ocultar preços" ----------
   A classe .show-prices vai no <main>, então vale para o cardápio e para os combos.
   Sem localStorage: ao recarregar a página, os preços voltam a ficar ocultos. */
function iniciarPrecos() {
  const botao = document.getElementById("price-toggle");
  const menu = document.getElementById("conteudo");
  if (!botao || !menu) return;
  const rotulo = botao.querySelector(".price-toggle__label");

  botao.addEventListener("click", () => {
    const mostrar = botao.getAttribute("aria-pressed") !== "true";
    botao.setAttribute("aria-pressed", String(mostrar));
    menu.classList.toggle("show-prices", mostrar);
    if (rotulo) rotulo.textContent = mostrar ? "Ocultar preços" : "Mostrar preços";
  });
}

/* ---------- 7. Aberto agora / Fechado ---------- */
function agoraNoFuso() {
  // Lê dia da semana, hora e minuto no fuso da loja, não no fuso do visitante
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: CONFIG.fusoHorario, weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23",
  }).formatToParts(new Date());
  const pega = (tipo) => partes.find((p) => p.type === tipo).value;
  const dias = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { dia: dias[pega("weekday")], minutos: Number(pega("hour")) * 60 + Number(pega("minute")) };
}

const paraMinutos = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };

function textoStatus() {
  const { dia, minutos } = agoraNoFuso();
  const hoje = CONFIG.horarios[dia];

  if (hoje && minutos >= paraMinutos(hoje.abre) && minutos < paraMinutos(hoje.fecha)) {
    return { aberto: true, texto: `Aberto agora, fecha às ${hoje.fecha}` };
  }
  // Fechado: procura a próxima abertura (hoje mais tarde ou nos próximos dias)
  if (hoje && minutos < paraMinutos(hoje.abre)) {
    return { aberto: false, texto: `Fechado agora, abre hoje às ${hoje.abre}` };
  }
  for (let i = 1; i <= 7; i++) {
    const d = (dia + i) % 7;
    const h = CONFIG.horarios[d];
    if (h) {
      const quando = i === 1 ? "amanhã" : NOMES_DIA[d];
      return { aberto: false, texto: `Fechado agora, abre ${quando} às ${h.abre}` };
    }
  }
  return { aberto: false, texto: "Fechado agora" };
}

function iniciarStatus() {
  const el = document.getElementById("open-status");
  if (!el || !window.Intl || !Intl.DateTimeFormat) return;

  const atualizar = () => {
    try {
      const s = textoStatus();
      el.textContent = s.texto;
      el.dataset.open = String(s.aberto);
      el.hidden = false;

      const { dia } = agoraNoFuso();
      document.querySelectorAll(".hours tr").forEach((tr) => {
        if (Number(tr.dataset.dow) === dia) tr.setAttribute("aria-current", "date");
        else tr.removeAttribute("aria-current");
      });
    } catch (erro) {
      el.hidden = true; // se algo falhar, a tabela de horários continua valendo
    }
  };
  atualizar();
  setInterval(atualizar, 60 * 1000);
}

/* ---------- 8. Vídeo do hero ----------
   Com "reduzir movimento" ou economia de dados, fica só o poster.
   Também pausa quando o hero sai da tela (poupa bateria). */
function iniciarVideo() {
  const video = document.querySelector(".hero video");
  if (!video) return;

  const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)");
  const conexao = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const economia = conexao && (conexao.saveData || /(^|-)2g$/.test(conexao.effectiveType || ""));

  if (reduzir.matches || economia) {
    video.removeAttribute("autoplay");
    video.preload = "none";
    video.pause();
    return; // fica o poster
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) { const p = video.play(); if (p && p.catch) p.catch(() => {}); }
        else video.pause();
      });
    }, { threshold: 0.1 }).observe(video);
  }
}

/* ---------- 9. Botão flutuante de WhatsApp ----------
   Aparece depois que os botões do hero saem da tela (assim não cobre o botão principal). */
function iniciarFlutuante() {
  const botao = document.querySelector(".wa-float");
  const alvo = document.querySelector(".hero__cta");
  if (!botao) return;
  if (!alvo || !("IntersectionObserver" in window)) { botao.classList.add("is-visible"); return; }

  new IntersectionObserver(([e]) => {
    // mostra só quando os botões do hero já passaram para cima da tela
    botao.classList.toggle("is-visible", !e.isIntersecting && e.boundingClientRect.top < 0);
  }).observe(alvo);
}

/* ---------- 10. Ano do rodapé ---------- */
function iniciarAno() {
  const el = document.getElementById("ano");
  if (el) el.textContent = String(new Date().getFullYear());
}

/* ---------- Início ---------- */
function iniciar() {
  aplicarLinks();
  varrerImagensQuebradas();
  iniciarMenu();
  iniciarAbas();
  iniciarPrecos();
  iniciarStatus();
  iniciarVideo();
  iniciarFlutuante();
  iniciarAno();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
else iniciar();
