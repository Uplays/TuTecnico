let techData = null;
let currentCategory = 'all';
let selectedTech = null;
let bookingState = {
    date: null,
    time: null,
    urgency: false
};

// Initialize App
async function init() {
    try {
        const response = await fetch('data.json');
        techData = await response.json();
        lucide.createIcons();
        renderTabs();
        renderTechs();
        setupSearch();
    } catch (error) {
        console.error('Error:', error);
    }
}

function renderTabs() {
    const container = document.getElementById('category-tabs');
    const categories = [
        { id: 'all', name: 'Todos', icon: 'layout-grid' },
        ...techData.categories
    ];

    container.innerHTML = categories.map(cat => `
        <div class="tab ${currentCategory === cat.id ? 'active' : ''}" onclick="filterBy('${cat.id}')">
            <i data-lucide="${cat.icon || 'star'}" style="width: 18px;"></i>
            ${cat.name}
        </div>
    `).join('');
    lucide.createIcons();
}

function renderTechs(searchQuery = '') {
    const grid = document.getElementById('tech-grid');
    grid.innerHTML = '';

    const filtered = techData.technicians.filter(t => {
        const matchesCat = currentCategory === 'all' || t.category === currentCategory;
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCat && matchesSearch;
    });

    filtered.forEach((t, index) => {
        const card = document.createElement('div');
        card.className = 'tech-card animate-in';
        card.style.animationDelay = `${index * 0.1}s`;
        card.innerHTML = `
            <div class="tech-image-container">
                <img src="${t.image}" loading="lazy" class="tech-image">
                ${t.verified ? `<div class="verified-badge"><i data-lucide="check-circle" style="width: 14px;"></i> Verificado</div>` : ''}
            </div>
            <div class="tech-info">
                <h3>${t.name} <div class="rating-pill">★ ${t.rating}</div></h3>
                <p class="tech-bio">${t.bio}</p>
                <div class="tech-skills">
                    ${t.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
                </div>
                <div class="tech-footer">
                    <div class="price-tag">
                        <span class="unit">Desde</span>
                        <span class="amount">${t.price}€<span style="font-size: 0.8rem; font-weight: 400; color: var(--text-dim);">/h</span></span>
                    </div>
                    <button class="book-btn" onclick="openBooking(${t.id})">Reservar Cita</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
    lucide.createIcons();
}

function filterBy(id) {
    currentCategory = id;
    renderTabs();
    renderTechs();
}

function setupSearch() {
    const input = document.getElementById('search-input');
    input.addEventListener('input', (e) => {
        renderTechs(e.target.value);
    });
}

function scrollToServices() {
    document.getElementById('services-section').scrollIntoView({ behavior: 'smooth' });
}

// Booking System
const modal = document.getElementById('booking-modal');
const chatWindow = document.getElementById('chat-window');
const chatOptions = document.getElementById('chat-options');
const appointmentArea = document.getElementById('appointment-area');

async function openBooking(techId) {
    selectedTech = techData.technicians.find(t => t.id === techId);
    bookingState = { date: null, time: null, urgency: false };

    // Update Sidebar
    document.getElementById('sidebar-img').src = selectedTech.image;
    document.getElementById('sidebar-name').innerText = selectedTech.name;
    document.getElementById('sidebar-category').innerText = selectedTech.category;
    document.getElementById('sidebar-rating').innerText = selectedTech.rating;
    document.getElementById('sidebar-exp').innerText = selectedTech.experience;
    document.getElementById('sidebar-price').innerText = selectedTech.price;

    modal.style.display = 'block';
    chatWindow.innerHTML = '';
    chatOptions.innerHTML = '';
    appointmentArea.style.display = 'none';

    await addBotMessage(`¡Excelente elección! Estoy aquí para ayudarte a agendar una cita con <strong>${selectedTech.name}</strong>.`);
    await addBotMessage('¿Cuál es el motivo de tu solicitud hoy?');

    showOptions([
        { text: '🛠️ Reparación Urgente', action: () => handleUrgency(true) },
        { text: '📅 Presupuesto / Cita Previa', action: () => handleUrgency(false) },
        { text: '💬 Solo una consulta', action: () => handleConsultation() }
    ]);
    lucide.createIcons();
}

async function addBotMessage(html) {
    const typing = document.createElement('div');
    typing.className = 'msg bot typing animate-in';
    typing.innerHTML = '<span></span><span></span><span></span>';
    chatWindow.appendChild(typing);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
    typing.remove();

    const msg = document.createElement('div');
    msg.className = 'msg bot animate-in';
    msg.innerHTML = html;
    chatWindow.appendChild(msg);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function addUserMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'msg user animate-in';
    msg.innerText = text;
    chatWindow.appendChild(msg);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function showOptions(options) {
    chatOptions.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'opt-btn';
        btn.innerText = opt.text;
        btn.onclick = () => {
            addUserMessage(opt.text);
            chatOptions.innerHTML = '';
            opt.action();
        };
        chatOptions.appendChild(btn);
    });
}

async function handleUrgency(isUrgent) {
    bookingState.urgency = isUrgent;
    if (isUrgent) {
        await addBotMessage('Entendido. Para servicios urgentes aplicamos un suplemento de desplazamiento de +25€. ¿Deseas continuar?');
        showOptions([
            { text: 'Sí, es muy urgente', action: () => showCalendarSection() },
            { text: 'No, mejor cita normal', action: () => { bookingState.urgency = false; showCalendarSection(); } }
        ]);
    } else {
        showCalendarSection();
    }
}

async function handleConsultation() {
    await addBotMessage(`Perfecto. Déjanos tu consulta y <strong>${selectedTech.name}</strong> te responderá en menos de 2 horas laborables.`);
    await addBotMessage('<input type="text" placeholder="Escribe tu duda aquí..." style="width:100%; padding:12px; border-radius:10px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; outline:none;">');
    showOptions([
        {
            text: 'Enviar Consulta', action: async () => {
                await addBotMessage('¡Mensaje enviado correctamente! Te contactaremos al número asociado a tu cuenta.');
                showOptions([{ text: 'Cerrar', action: closeModal }]);
            }
        }
    ]);
}

async function showCalendarSection() {
    await addBotMessage('Perfecto. Ahora selecciona el día y la hora que mejor te vengan para que podamos cerrar la agenda.');
    appointmentArea.style.display = 'block';
    renderDatePicker();
}

function renderDatePicker() {
    const picker = document.getElementById('date-picker');
    picker.innerHTML = '';
    const today = new Date();

    for (let i = 0; i < 14; i++) {
        const date = new Date();
        date.setDate(today.getDate() + i);
        const dayNum = date.getDate();
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

        const el = document.createElement('div');
        el.className = `day ${isWeekend ? 'disabled' : ''}`;
        el.style.cssText = `
            aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
            border-radius: 10px; cursor: pointer; transition: 0.2s; font-size: 0.9rem;
            background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border);
        `;
        el.innerText = dayNum;

        if (!isWeekend) {
            el.onclick = () => {
                document.querySelectorAll('.day').forEach(d => d.style.background = 'rgba(255,255,255,0.05)');
                el.style.background = 'var(--primary)';
                bookingState.date = date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
                renderTimePicker();
            };
        }
        picker.appendChild(el);
    }
}

function renderTimePicker() {
    const picker = document.getElementById('time-picker');
    picker.innerHTML = '';

    selectedTech.slots.forEach(slot => {
        const btn = document.createElement('button');
        btn.className = 'opt-btn';
        btn.innerText = slot;
        btn.onclick = () => {
            bookingState.time = slot;
            finishBooking();
        };
        picker.appendChild(btn);
    });
}

async function finishBooking() {
    appointmentArea.style.display = 'none';
    await addBotMessage(`¡Cita pre-confirmada! 🚀 Resumen:`);
    await addBotMessage(`
        <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:15px; border-left:4px solid var(--primary);">
            <strong>Técnico:</strong> ${selectedTech.name}<br>
            <strong>Fecha:</strong> ${bookingState.date}<br>
            <strong>Hora:</strong> ${bookingState.time}<br>
            <strong>Servicio:</strong> ${bookingState.urgency ? 'Urgente ⚡' : 'Normal'}
        </div>
    `);
    await addBotMessage('¿Confirmamos la reserva ahora mismo?');
    showOptions([
        {
            text: '✅ Confirmar Reserva', action: async () => {
                await addBotMessage('<strong>¡Reserva Confirmada!</strong> En breve recibirás un SMS con los detalles del técnico y el enlace de seguimiento.');
                showOptions([{ text: 'Cerrar y ver más técnicos', action: closeModal }]);
            }
        },
        { text: '❌ Cancelar', action: closeModal }
    ]);
}

function closeModal() {
    modal.style.display = 'none';
    appointmentArea.style.display = 'none';
}

// Footer & Info Functions
function closeInfoModal() {
    document.getElementById('info-modal').style.display = 'none';
}

function openSupportChat() {
    // ... support chat logic stays if needed, but let's just keep the global init
}

// Global Init
window.onload = init;
document.addEventListener('click', (e) => {
    if (e.target.id === 'booking-modal') {
        closeModal();
    }
});
