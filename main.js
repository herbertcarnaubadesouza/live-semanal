document.addEventListener('DOMContentLoaded', function () {
    /* =======================
       COUNTDOWN: toda QUARTA às 20:00 (BRT)
       ======================= */
    const $d = document.getElementById('d');
    const $h = document.getElementById('h');
    const $m = document.getElementById('m');
    const $s = document.getElementById('s');
  
    if ($d && $h && $m && $s) {
      const MS = { sec: 1000, min: 60_000, hour: 3_600_000, day: 86_400_000 };
      const BRT_TZ = 'America/Sao_Paulo';
  
      function pad(n) { return String(n).padStart(2, '0'); }
  
      function brtParts(d = new Date()) {
        const parts = new Intl.DateTimeFormat('en-CA', {
          timeZone: BRT_TZ,
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          hour12: false, weekday: 'short',
        }).formatToParts(d).reduce((acc, p) => ((acc[p.type] = p.value), acc), {});
        return parts; // {year,month,day,hour,minute,second,weekday}
      }
  
      function nextWednesday20BRT() {
        const wdIndex = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
        const p = brtParts();
        const todayIdx = wdIndex[p.weekday];
        let daysAhead = (3 - todayIdx + 7) % 7; // 3 = Wednesday
        const passed20 = Number(p.hour) > 20 || (Number(p.hour) === 20 && (Number(p.minute) > 0 || Number(p.second) > 0));
        if (todayIdx === 3 && passed20) daysAhead = 7;
        const baseISO = `${p.year}-${p.month}-${p.day}T00:00:00-03:00`;
        const base = new Date(baseISO);
        const targetMs = base.getTime() + daysAhead * MS.day + 20 * MS.hour;
        return new Date(targetMs);
      }
  
      let target = nextWednesday20BRT();
      function tick() {
        let diff = target - new Date();
        if (diff <= 0) { target = nextWednesday20BRT(); diff = target - new Date(); }
        const days = Math.floor(diff / MS.day);
        const hours = Math.floor((diff % MS.day) / MS.hour);
        const mins = Math.floor((diff % MS.hour) / MS.min);
        const secs = Math.floor((diff % MS.min) / MS.sec);
        $d.textContent = pad(days); $h.textContent = pad(hours);
        $m.textContent = pad(mins); $s.textContent = pad(secs);
      }
      tick(); setInterval(tick, 1000);
    }
  
    /* =======================
       FORM: envio + redirect + Pixel dedupe
       ======================= */
    var form = document.getElementById('leadForm');
    if (!form) return;
  
    var btn = document.getElementById('cta');
    var nomeEl = document.getElementById('nome');
    var emailEl = document.getElementById('email');
    var telEl = document.getElementById('tel');
  
    var ENDPOINT = 'https://cbs.herbertcarnauba.com.br/api/leads';
    var WHATSAPP_URL = 'https://chat.whatsapp.com/EJjYwzRiCA85e9yrEwi8uV?mode=ems_wa_t'; // troque pelo link real
  
    // ---- helpers cookies Pixel
    function getCookie(name) {
      const m = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]*)"));
      return m ? decodeURIComponent(m[2]) : null;
    }
    function getFbp() {
      const v = getCookie('_fbp');
      return v || undefined;
    }
    function getFbc() {
      const existing = getCookie('_fbc');
      if (existing) return existing;
      const url = new URL(window.location.href);
      const fbclid = url.searchParams.get('fbclid');
      if (fbclid) return `fb.1.${Date.now()}.${fbclid}`;
      return undefined;
    }
  
    // ---- validação + máscara tel
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    function formatPhone(v) {
      const p = (v || '').replace(/\D/g, '');
      if (p.length <= 10) return p.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
      return p.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
    }
    function validate(name, email, telefone) {
      if (!name) return 'Preencha seu nome.';
      if (name.trim().length < 2) return 'Nome muito curto.';
      if (!email) return 'Preencha seu email.';
      if (!emailRegex.test(email)) return 'Email inválido.';
      const digits = (telefone || '').replace(/\D/g, '');
      if (!digits) return 'Preencha seu telefone.';
      if (digits.length < 10 || digits.length > 11) return 'Telefone deve ter 10 ou 11 dígitos.';
      return '';
    }
  
    // máscara dinâmica no input
    if (telEl) {
      telEl.addEventListener('input', function (e) {
        const caret = e.target.selectionStart;
        const before = e.target.value;
        e.target.value = formatPhone(e.target.value);
        const diff = e.target.value.length - before.length;
        const pos = Math.max(0, (caret || 0) + (diff > 0 ? diff : 0));
        e.target.setSelectionRange(pos, pos);
      });
    }
  
    function toParams(obj) {
      var params = new URLSearchParams();
      for (var k in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] != null) {
          params.append(k, String(obj[k]));
        }
      }
      return params.toString();
    }
  
    form.addEventListener('submit', function (e) {
      e.preventDefault();
  
      var nome = nomeEl ? (nomeEl.value || '').trim() : '';
      var email = emailEl ? (emailEl.value || '').trim() : '';
      var telefone = telEl ? (telEl.value || '').trim() : '';
  
      var err = validate(nome, email, telefone);
      if (err) { alert(err); return; }
  
      if (btn) { btn.disabled = true; btn.style.opacity = '0.7'; }
  
      // eventId para dedupe
      var eventId = (window.crypto && window.crypto.randomUUID)
        ? window.crypto.randomUUID()
        : (Date.now() + '-' + Math.random());
  
      var payload = {
        // compatibilidade legada (se seu backend já esperava esses campos no topo)
        nome: nome,
        email: email,
        telefone: telefone,
        origem: 'landing-live',
  
        // payload no formato do seu app React
        formData: { name: nome, email: email, phone: telefone },
        eventId: eventId,
        fbp: getFbp(),
        fbc: getFbc(),
      };
  
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (resp) {
          // Pixel browser com o MESMO eventId
          if (typeof window.fbq === 'function') {
            window.fbq('track', 'Lead', { value: 0, currency: 'BRL' }, { eventID: eventId });
          }
  
          var saved = resp && resp.ok ? '1' : '0';
          var qs = toParams({ g: WHATSAPP_URL, nome, email, telefone, saved, eventId });
          window.location.href = 'pendente/index.html?' + qs;
        })
        .catch(function () {
          var qs = toParams({ g: WHATSAPP_URL, nome, email, telefone, saved: '0', eventId });
          console.log(qs);
        //   window.location.href = 'pendente/index.html?' + qs;
        })
        .finally(function () {
          if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
        });
    });
  });
  