// ===== Countdown para toda QUARTA às 20:00 (BRT) =====
const BRT_TZ = 'America/Sao_Paulo';
const MS = { sec: 1000, min: 60_000, hour: 3_600_000, day: 86_400_000 };

const $d = document.getElementById('d');
const $h = document.getElementById('h');
const $m = document.getElementById('m');
const $s = document.getElementById('s');

function pad(n) {
    return String(n).padStart(2, '0');
}

// Retorna partes da data "agora" em São Paulo
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
    return parts; // {year, month, day, hour, minute, second, weekday}
}

// Calcula o próximo instante de QUARTA 20:00 em São Paulo
function nextWednesday20BRT() {
    const wdIndex = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const p = brtParts(); // agora em BRT

    const todayIdx = wdIndex[p.weekday];
    let daysAhead = (3 - todayIdx + 7) % 7; // 3 = Wednesday

    // Se hoje já passou das 20:00 em BRT e hoje é quarta, empurra pra próxima semana
    const passed20 =
        Number(p.hour) > 20 ||
        (Number(p.hour) === 20 &&
            (Number(p.minute) > 0 || Number(p.second) > 0));
    if (todayIdx === 3 && passed20) daysAhead = 7;

    // Monta data base (meia-noite BRT do "hoje") com offset fixo -03:00
    // (Brasil sem horário de verão desde 2019)
    const baseISO = `${p.year}-${p.month}-${p.day}T00:00:00-03:00`;
    const base = new Date(baseISO);

    // Alvo: base + daysAhead + 20h
    const targetMs = base.getTime() + daysAhead * MS.day + 20 * MS.hour;
    return new Date(targetMs);
}

let target = nextWednesday20BRT();

function tick() {
    let diff = target - new Date();
    if (diff <= 0) {
        // Já chegou/virou: recalcula para a próxima quarta 20:00
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

// ===== Máscara de telefone BR simples =====
const tel = document.getElementById('tel');
if (tel) {
    tel.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '').slice(0, 11);
        const isNine = v.length > 10;
        if (v.length >= 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
        if (v.length >= 10 && !isNine)
            v = v.replace(/(\(\d{2}\)\s)(\d{4})(\d{0,4})/, '$1$2-$3');
        if (v.length >= 11 && isNine)
            v = v.replace(/(\(\d{2}\)\s)(\d{5})(\d{0,4})/, '$1$2-$3');
        e.target.value = v;
    });
}

// ===== Validação básica do formulário =====
const form = document.getElementById('leadForm');
if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        // Aqui você pode integrar com seu endpoint:
        // fetch('/api/lead', { method: 'POST', body: new FormData(form) })
        alert('Inscrição realizada! Enviaremos o link por e-mail/WhatsApp.');
        form.reset();
    });
}
