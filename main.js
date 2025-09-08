document.addEventListener('DOMContentLoaded', function () {
    /* =======================
       COUNTDOWN: toda QUARTA às 20:00 (BRT)
       ======================= */
    const $d = document.getElementById('d');
    const $h = document.getElementById('h');
    const $m = document.getElementById('m');
    const $s = document.getElementById('s');

    // Se a barra não existir na página, não faz nada
    if ($d && $h && $m && $s) {
        const MS = { sec: 1000, min: 60_000, hour: 3_600_000, day: 86_400_000 };
        const BRT_TZ = 'America/Sao_Paulo';

        function pad(n) {
            return String(n).padStart(2, '0');
        }

        // Partes "agora" em São Paulo (seguro em todos os browsers modernos)
        function brtParts(d = new Date()) {
            const parts = new Intl.DateTimeFormat('en-CA', {
                timeZone: BRT_TZ,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
                weekday: 'short',
            })
                .formatToParts(d)
                .reduce((acc, p) => ((acc[p.type] = p.value), acc), {});
            return parts; // {year,month,day,hour,minute,second,weekday}
        }

        function nextWednesday20BRT() {
            const wdIndex = {
                Sun: 0,
                Mon: 1,
                Tue: 2,
                Wed: 3,
                Thu: 4,
                Fri: 5,
                Sat: 6,
            };
            const p = brtParts();

            const todayIdx = wdIndex[p.weekday]; // índice do dia em BRT
            let daysAhead = (3 - todayIdx + 7) % 7; // 3 = Wednesday

            // já passou das 20:00 da própria quarta? então empurra pra próxima
            const passed20 =
                Number(p.hour) > 20 ||
                (Number(p.hour) === 20 &&
                    (Number(p.minute) > 0 || Number(p.second) > 0));
            if (todayIdx === 3 && passed20) daysAhead = 7;

            // meia-noite BRT de hoje, com offset fixo -03:00 (sem DST no BR)
            const baseISO = `${p.year}-${p.month}-${p.day}T00:00:00-03:00`;
            const base = new Date(baseISO);

            const targetMs = base.getTime() + daysAhead * MS.day + 20 * MS.hour;
            return new Date(targetMs);
        }

        let target = nextWednesday20BRT();

        function tick() {
            let diff = target - new Date();
            if (diff <= 0) {
                // chegou? recalcula para a próxima quarta
                target = nextWednesday20BRT();
                diff = target - new Date();
            }
            const days = Math.floor(diff / MS.day);
            const hours = Math.floor((diff % MS.day) / MS.hour);
            const mins = Math.floor((diff % MS.hour) / MS.min);
            const secs = Math.floor((diff % MS.min) / MS.sec);

            $d.textContent = pad(days);
            $h.textContent = pad(hours);
            $m.textContent = pad(mins);
            $s.textContent = pad(secs);
        }

        tick();
        setInterval(tick, 1000);
    }

    /* =======================
       FORM: envio + redirect
       ======================= */
    var form = document.getElementById('leadForm');
    var btn = document.getElementById('cta');

    var ENDPOINT = 'https://cbs.herbertcarnauba.com.br/api/leads'; // sua API
    var WHATSAPP_URL = 'https://chat.whatsapp.com/SEU_GRUPO'; // seu link

    function toParams(obj) {
        var params = new URLSearchParams();
        for (var k in obj) {
            if (
                Object.prototype.hasOwnProperty.call(obj, k) &&
                obj[k] != null
            ) {
                params.append(k, String(obj[k]));
            }
        }
        return params.toString();
    }

    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var nomeEl = document.getElementById('nome');
        var emailEl = document.getElementById('email');
        var telEl = document.getElementById('tel');

        var nome = nomeEl ? (nomeEl.value || '').trim() : '';
        var email = emailEl ? (emailEl.value || '').trim() : '';
        var telefone = telEl ? (telEl.value || '').trim() : '';

        if (!nome || !email || !telefone) {
            alert('Preencha nome, email e telefone.');
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.style.opacity = '0.7';
        }

        fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome: nome,
                email: email,
                telefone: telefone,
                origem: 'landing-live',
            }),
        })
            .then(function (resp) {
                var qs = toParams({
                    g: WHATSAPP_URL,
                    nome,
                    email,
                    telefone,
                    saved: resp && resp.ok ? '1' : '0',
                });
                window.location.href = 'pendente/index.html?' + qs;
            })
            .catch(function () {
                var qs = toParams({
                    g: WHATSAPP_URL,
                    nome,
                    email,
                    telefone,
                    saved: '0',
                });
                window.location.href = 'pendente/index.html?' + qs;
            });
    });
});
