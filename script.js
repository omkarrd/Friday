// --- DOM Elements ---
const mainContent = document.getElementById('main-content');
const navButtons = document.querySelectorAll('.icon-btn[data-page]');
const pages = document.querySelectorAll('.main-view');
const micBtn = document.getElementById('mic-btn');
const sphereWrapper = document.getElementById('sphere-wrapper');
const sphereContainer = document.getElementById('sphere-container');
const visualizerCanvas = document.getElementById('visualizer');
const graficsPencilIcon = document.getElementById('grafics-pencil-icon');
const imageUploadInput = document.getElementById('image-upload-input');
const graficsImage = document.getElementById('grafics-image');
const graficsPlaceholder = document.getElementById('grafics-placeholder');
const quickAccessButtons = document.querySelectorAll('[data-access]');
const addFileBtn = document.getElementById('add-file-btn');
const deleteFileBtn = document.getElementById('delete-file-btn');
const fileContainer = document.getElementById('file-container');

// --- State ---
let isListening = false;
let audioContext, analyser, microphone;
let recognition;

// --- Page Navigation & Sphere Animation ---
navButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetPageId = `page-${button.dataset.page}`;
        const targetPage = document.getElementById(targetPageId);
        pages.forEach(page => page.classList.add('hidden'));
        targetPage.classList.remove('hidden');
        navButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const placeholder = targetPage.querySelector('.sphere-placeholder');
        if (placeholder) {
            // Move sphere to the placeholder in the corner
            placeholder.appendChild(sphereWrapper);
            sphereWrapper.classList.add('minimized');
        } else {
            // Move sphere back to the main content for the dashboard
            mainContent.appendChild(sphereWrapper);
            sphereWrapper.classList.remove('minimized');
        }
    });
});

// --- 1. Clock and Static Day ---
// --- Dashboard Bar Animation ---
function fluctuateDashboardBars() {
    const barHeights = [60, 35, 80, 40]; // initial percentages
    const barDivs = [
        document.querySelectorAll('.flex-1.flex.items-end.justify-around.gap-2.h-16 > div')[0].firstElementChild,
        document.querySelectorAll('.flex-1.flex.items-end.justify-around.gap-2.h-16 > div')[1].firstElementChild,
        document.querySelectorAll('.flex-1.flex.items-end.justify-around.gap-2.h-16 > div')[2].firstElementChild,
        document.querySelectorAll('.flex-1.flex.items-end.justify-around.gap-2.h-16 > div')[3].firstElementChild
    ];
    setInterval(() => {
        for (let i = 0; i < barDivs.length; i++) {
            // Random fluctuation between -10% and +10%
            let change = (Math.random() * 20) - 10;
            barHeights[i] = Math.max(10, Math.min(100, barHeights[i] + change));
            barDivs[i].style.height = barHeights[i] + '%';
        }
    }, 1000);
}
window.addEventListener('DOMContentLoaded', fluctuateDashboardBars);
// --- Dashboard Value Animation ---
function fluctuateDashboardValues() {
    // Select the four dashboard value elements (TEMP, CPU, MEM, DISK)
    const valueEls = Array.from(document.querySelectorAll('.absolute.bottom-8 .flex.items-center.gap-4 .text-center .text-2xl'));
    // Initial values from HTML
    let values = valueEls.map(el => parseInt(el.textContent, 10));
    setInterval(() => {
        for (let i = 0; i < valueEls.length; i++) {
            // Fluctuate by ±4-8% of current value
            const percent = (Math.random() * 4) + 4; // 4 to 8
            const direction = Math.random() < 0.5 ? -1 : 1;
            let change = values[i] * percent / 100 * direction;
            values[i] = Math.max(0, Math.round(values[i] + change));
            valueEls[i].textContent = values[i];
        }
    }, 1000);
}
window.addEventListener('DOMContentLoaded', fluctuateDashboardValues);
function updateTime() {
    const now = new Date();
    document.getElementById('time').textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    document.getElementById('ampm').textContent = now.getHours() >= 12 ? 'PM' : 'AM';
    document.getElementById('date').textContent = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
setInterval(updateTime, 1000);
updateTime();

// --- 2 & 5. Microphone, Speech Recognition, and Sphere Interaction ---
function toggleListening() {
    isListening = !isListening;
    micBtn.classList.toggle('listening', isListening);
    if (isListening) {
        startSpeechRecognition();
    } else {
        stopSpeechRecognition();
    }
}
micBtn.addEventListener('click', toggleListening);
sphereContainer.addEventListener('click', toggleListening);

function startSpeechRecognition() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            microphone = audioContext.createMediaStreamSource(stream);
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            microphone.connect(analyser);
            
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if(SpeechRecognition){
                recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.onstart = () => console.log("Voice recognition started.");
                recognition.onend = () => { if(isListening) recognition.start(); };
                recognition.onresult = (event) => { console.log(event.results[event.results.length - 1][0].transcript); };
                recognition.start();
            }
        }).catch(err => createNotification('Error accessing microphone: ' + err.message, 'error'));
    }
}

function stopSpeechRecognition() {
    if (recognition) recognition.stop();
    if (microphone) microphone.mediaStream.getTracks().forEach(track => track.stop());
    microphone = null;
    analyser = null;
}

// --- 3. Graphical Image Upload ---
graficsPencilIcon.addEventListener('click', () => imageUploadInput.click());
imageUploadInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            graficsImage.src = e.target.result;
            graficsImage.classList.remove('hidden');
            graficsPlaceholder.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }
});

// --- 4. Quick Access Panel ---
quickAccessButtons.forEach(button => {
    button.addEventListener('click', () => {
        const accessType = button.dataset.access;
        if (accessType === 'camera') openCameraModal();
        else createNotification(`Simulating access to ${accessType}...`, 'info');
    });
});

async function openCameraModal() {
    const modal = createModal('Webcam Access');
    const videoEl = document.createElement('video');
    videoEl.id = 'camera-feed';
    videoEl.autoplay = true;
    modal.querySelector('.modal-content').appendChild(videoEl);
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoEl.srcObject = stream;
        modal.addEventListener('close', () => stream.getTracks().forEach(track => track.stop()));
    } catch (err) {
        modal.querySelector('.modal-content').innerHTML += `<p class="text-red-400 mt-2">Could not access camera: ${err.message}</p>`;
    }
}

// --- 5. Enhanced Sphere & Wave Visualizer ---
const ctx = visualizerCanvas.getContext('2d');
let time = 0;
let particles = [];
function resizeCanvas() {
    visualizerCanvas.width = visualizerCanvas.offsetWidth;
    visualizerCanvas.height = visualizerCanvas.offsetHeight;
    createParticles();
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.baseY = y;
        this.size = Math.random() * 1.5 + 0.5;
        this.color = color;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
    update(amplitude) {
        const wave1 = Math.sin((this.x * 0.02) + (time * 0.03)) * (amplitude / 2);
        const wave2 = Math.sin((this.x * 0.03) + (time * 0.05)) * (amplitude / 4);
        const noise = (Math.random() - 0.5) * (amplitude / 10);
        this.y = this.baseY + wave1 + wave2 + noise;
        this.draw();
    }
}

function createParticles() {
    particles = [];
    const particleCount = 2000;
    for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * visualizerCanvas.width;
        const y = visualizerCanvas.height / 2;
        const color = Math.random() > 0.3 ? 'rgba(0, 190, 255, 0.8)' : 'rgba(255, 40, 150, 0.8)';
        particles.push(new Particle(x, y, color));
    }
}

function animateVisualizer() {
    requestAnimationFrame(animateVisualizer);
    ctx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
    const centerX = visualizerCanvas.width / 2;
    const centerY = visualizerCanvas.height / 2;
    const baseRadius = Math.min(visualizerCanvas.width, visualizerCanvas.height) / 2.5;
    
    let amplitude = 20; // Default amplitude when silent
    if (analyser) {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        amplitude = Math.max(20, average); // Ensure a minimum amplitude
    }
    
    const dynamicRadius = baseRadius + amplitude * 0.2;

    // Draw particle wave
    particles.forEach(p => p.update(amplitude));

    // Draw central sphere
    const glowGradient = ctx.createRadialGradient(centerX, centerY, dynamicRadius * 0.7, centerX, centerY, dynamicRadius * 1.2);
    glowGradient.addColorStop(0, 'rgba(0, 190, 255, 0.4)');
    glowGradient.addColorStop(1, 'rgba(0, 190, 255, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, dynamicRadius * 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.globalAlpha = 0.5 + Math.sin(time * 0.05) * 0.2;
    const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, dynamicRadius);
    coreGradient.addColorStop(0, 'rgba(200, 240, 255, 0.8)');
    coreGradient.addColorStop(1, 'rgba(0, 190, 255, 0.3)');
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, dynamicRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Update circular progress bar
    const progressBar = document.getElementById('circular-progress-bar');
    if (progressBar) {
        if (isListening) {
            const progress = Math.min(100, (amplitude - 20) * 1.2);
            progressBar.style.strokeDasharray = `${progress}, 100`;
        } else {
            progressBar.style.strokeDasharray = '85, 100';
        }
    }

    time++;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
animateVisualizer();

// --- 6. System Manager Graphs ---
Chart.defaults.color = 'rgba(255,255,255,0.7)';
Chart.defaults.font.family = "'Russo One', sans-serif";
function createChart(ctx, color) {
    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.clientHeight);
    gradient.addColorStop(0, `${color}BF`);
    gradient.addColorStop(1, `${color}00`);
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(30).fill(''),
            datasets: [{ data: Array(30).fill(0), borderColor: color, backgroundColor: gradient, fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, max: 100, ticks: { color: 'rgba(255,255,255,0.3)', callback: (v) => v + '%' }, grid: { color: 'rgba(255,255,255,0.1)', drawBorder: false } },
                x: { ticks: { display: false }, grid: { display: false } }
            }
        }
    });
}
const cpuChart = createChart(document.getElementById('cpuChart').getContext('2d'), '#00bcd4');
const ramChart = createChart(document.getElementById('ramChart').getContext('2d'), '#4caf50');
const networkChart = createChart(document.getElementById('networkChart').getContext('2d'), '#f44336');
const diskChart = createChart(document.getElementById('diskChart').getContext('2d'), '#9c27b0');

setInterval(() => {
    const cpuUsage = Math.random() * 60 + 10;
    const ramUsage = Math.random() * 50 + 40;
    const networkUsage = Math.random() * (isListening ? 80 : 20);
    const diskUsage = Math.random() * 5 + 10;
    [cpuChart, ramChart, networkChart, diskChart].forEach((chart, i) => {
        chart.data.datasets[0].data.shift();
        chart.data.datasets[0].data.push([cpuUsage, ramUsage, networkUsage, diskUsage][i]);
        chart.update('quiet');
    });
    document.getElementById('cpu-details').textContent = `${cpuUsage.toFixed(0)}% 3.20 GHz`;
    document.getElementById('ram-details').textContent = `${(15.9 * (ramUsage/100)).toFixed(1)}/15.9 GB (${ramUsage.toFixed(0)}%)`;
    document.getElementById('network-details').textContent = `S: ${(networkUsage * 2).toFixed(1)} kbps R: ${(networkUsage * 1.5).toFixed(1)} kbps`;
    document.getElementById('disk-details').textContent = `${diskUsage.toFixed(0)}%`;
}, 1500);

// --- 7. Daily Data File Management ---
addFileBtn.addEventListener('click', () => {
    const newFileEl = document.createElement('div');
    newFileEl.className = "text-center cursor-pointer file-item";
    newFileEl.tabIndex = 0;
    newFileEl.innerHTML = `<svg class="w-24 h-24 text-cyan-400 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.11 0-2 .89-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"></path></svg><p>New Folder</p>`;
    fileContainer.appendChild(newFileEl);
    attachFileItemListeners();
    createNotification(`'New Folder' created.`, 'success');
});
deleteFileBtn.addEventListener('click', () => {
    const selected = document.querySelector('.file-item.selected');
    if (selected) {
        const fileName = selected.querySelector('p').textContent;
        selected.remove();
        createNotification(`'${fileName}' deleted.`, 'error');
    } else {
        createNotification('Select a file to delete.', 'info');
    }
});
function attachFileItemListeners() {
    document.querySelectorAll('.file-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.file-item').forEach(i => i.classList.remove('selected', 'bg-cyan-500/20', 'rounded-lg'));
            item.classList.add('selected', 'bg-cyan-500/20', 'rounded-lg');
        });
    });
}
attachFileItemListeners();

// --- Helper Functions ---
function createNotification(message, type = 'info') {
    const colors = { info: 'bg-blue-500', success: 'bg-green-500', error: 'bg-red-500' };
    const notif = document.createElement('div');
    notif.className = `w-64 p-3 rounded-lg text-white ${colors[type]} animate-pulse`;
    notif.textContent = message;
    document.getElementById('notification-container').appendChild(notif);
    setTimeout(() => notif.remove(), 4000);
}
function createModal(title) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal-content"><div class="flex justify-between items-center mb-4"><h2 class="text-xl">${title}</h2><button id="close-modal" class="p-2">&times;</button></div></div>`;
    document.getElementById('modal-container').appendChild(overlay);
    const close = () => {
        overlay.dispatchEvent(new Event('close'));
        overlay.remove();
    };
    overlay.querySelector('#close-modal').onclick = close;
    return overlay;
}
