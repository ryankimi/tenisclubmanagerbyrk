// =====================================================================
// API CONFIGURATION
// =====================================================================
const JSONBIN_API_KEY = "$2a$10$sZDo3Y8ECzT3IV9Wscd0y.Zay7lus4MQrvu30Fqw9lDKl3UCXZ5RS";
const JSONBIN_BIN_ID = "68b6b3beae596e708fdff3b5";
const JSONBIN_API_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

// =====================================================================
// GLOBAL VARIABLES & ELEMENT FINDING
// =====================================================================
let tennisAppClubs = [];
let activeClubId = null;
let activeDayId = null;

// Pages
const semuaHalaman = document.querySelectorAll('.page');
const halamanDaftarKlub = document.getElementById('halaman-daftar-klub');
const halamanDaftarHari = document.getElementById('halaman-daftar-hari');
const halamanUtama = document.getElementById('halaman-utama');
const halamanKlasemenUmum = document.getElementById('halaman-klasemen-umum');

// Club List Page Elements
const containerDaftarKlub = document.getElementById('container-daftar-klub');
const tombolTambahKlubBaru = document.getElementById('tombol-tambah-klub-baru');

// Day List Page Elements
const kembaliKeDaftarKlub = document.getElementById('kembali-ke-daftar-klub');
const displayNamaKlubDiDaftarHari = document.getElementById('display-nama-klub-di-daftar-hari');
const containerDaftarHari = document.getElementById('container-daftar-hari');
const tombolTambahHariBaru = document.getElementById('tombol-tambah-hari-baru');
const tombolLihatKlasemen = document.getElementById('tombol-lihat-klasemen');

// Main Setup Page Elements
const kembaliKeDaftarHari = document.getElementById('kembali-ke-daftar-hari'); 
const displayNamaKlubDiUtama = document.getElementById('display-nama-klub-di-utama');
const judulHariAktif = document.getElementById('judul-hari-aktif');
const pilihanTipePertandingan = document.getElementById('pilihan-tipe-pertandingan');
const setupPemainDanMatch = document.getElementById('setup-pemain-dan-match');
const tombolSingle = document.getElementById('tombol-single');
const tombolDouble = document.getElementById('tombol-double');
const tombolTambahPemain = document.getElementById('tombol-tambah-pemain');
const inputNamaPemain = document.getElementById('input-nama-pemain');
const daftarPemain = document.getElementById('daftar-pemain');
const wadahPertandingan = document.getElementById('wadah-pertandingan');
const tombolTambahMatch = document.getElementById('tombol-tambah-match');
const wadahPertandinganSelesai = document.getElementById('wadah-pertandingan-selesai');

// Standings Page Elements
const kembaliDariKlasemen = document.getElementById('kembali-dari-klasemen');
const displayNamaKlubDiKlasemen = document.getElementById('display-nama-klub-di-klasemen');
const containerKlasemenUmum = document.getElementById('container-klasemen-umum');
const tombolShareKlasemen = document.getElementById('tombol-share-klasemen');

// =====================================================================
// API FUNCTIONS
// =====================================================================
async function saveToJSONBin(data) {
    const headers = { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_API_KEY };
    const response = await fetch(JSONBIN_API_URL, { method: 'PUT', headers: headers, body: JSON.stringify(data) });
    if (!response.ok) throw new Error(`Failed to save data: ${response.status}`);
}

async function loadFromJSONBin() {
    const headers = { 'X-Master-Key': JSONBIN_API_KEY };
    const response = await fetch(`${JSONBIN_API_URL}/latest`, { headers: headers, cache: 'no-store' });
    if (!response.ok) {
        if (response.status === 404) {
            console.log("Bin not found, creating a new one with 'clubs' structure.");
            await saveToJSONBin({ clubs: [] });
            return { clubs: [] };
        }
        throw new Error(`Failed to load data: ${response.status}`);
    }
    const data = await response.json();
    return data.record;
}

// =====================================================================
// CORE FUNCTIONS
// =====================================================================
function tampilkanHalaman(idHalaman) {
    semuaHalaman.forEach(h => h.classList.add('hidden'));
    document.getElementById(idHalaman).classList.remove('hidden');
}

async function saveState() {
    if (activeClubId !== null && activeDayId !== null) {
        const club = getActiveClub();
        const day = getActiveDay();
        if (club && day) {
            day.players = Array.from(daftarPemain.querySelectorAll('.item-pemain')).map(p => p.textContent);
            document.querySelectorAll('#wadah-pertandingan input, #wadah-pertandingan-selesai input').forEach(input => {
                input.setAttribute('value', input.value);
            });
            day.matchesHTML.active = wadahPertandingan.innerHTML;
            day.matchesHTML.finished = wadahPertandinganSelesai.innerHTML;
        }
    }
    try {
        await saveToJSONBin({ clubs: tennisAppClubs });
    } catch (error) {
        console.error("Error saving state:", error);
    }
}

async function initializeApp() {
    try {
        const data = await loadFromJSONBin();
        tennisAppClubs = data.clubs || [];
        renderDaftarKlub();
        tampilkanHalaman('halaman-daftar-klub');
    } catch (error) {
        console.error("Error initializing app:", error);
        alert("Could not initialize the application. Please check your API keys and Bin ID in script.js.");
    }
}

// =====================================================================
// DRAG-AND-DROP LOGIC & HELPERS
// =====================================================================
daftarPemain.addEventListener('dragstart', (event) => {
    if (event.target.classList.contains('item-pemain')) {
        event.dataTransfer.setData('text/plain', event.target.textContent);
    }
});

function allowDrop(event) { event.preventDefault(); }

function handleDragEnter(event) {
    const targetSlot = event.target.closest('.slot-pemain');
    if (targetSlot) {
        targetSlot.classList.add('drag-over-highlight');
    }
}

function handleDragLeave(event) {
    const targetSlot = event.target.closest('.slot-pemain');
    if (targetSlot) {
        targetSlot.classList.remove('drag-over-highlight');
    }
}

function drop(event) {
    event.preventDefault();
    const targetSlot = event.target.closest('.slot-pemain');
    if (targetSlot) {
        targetSlot.classList.remove('drag-over-highlight');
        const namaPemain = event.dataTransfer.getData('text/plain');
        if (namaPemain && targetSlot.children.length === 0) {
            const elemenBaruDiSlot = document.createElement('div');
            elemenBaruDiSlot.textContent = namaPemain;
            elemenBaruDiSlot.className = 'item-pemain';
            targetSlot.appendChild(elemenBaruDiSlot);
            pasangUlangEventListeners();
        }
    }
}

function getActiveClub() { return tennisAppClubs.find(c => c.clubId === activeClubId); }
function getActiveDay() {
    const club = getActiveClub();
    if (!club || activeDayId === null) return null;
    return club.days.find(d => d.id === activeDayId);
}
function createPlayerElement(playerName) {
    const pemainBaru = document.createElement('div');
    pemainBaru.textContent = playerName;
    pemainBaru.className = 'item-pemain';
    pemainBaru.addEventListener('click', function() { this.remove(); saveState(); });
    pemainBaru.draggable = true;
    daftarPemain.appendChild(pemainBaru);
}
function pasangUlangEventListeners() {
    document.querySelectorAll('.slot-pemain .item-pemain').forEach(pemainDiSlot => {
        if (pemainDiSlot.onclick && pemainDiSlot.onclick.toString().includes('this.remove()')) return; // Avoid re-attaching
        pemainDiSlot.onclick = function() {
            const matchBox = this.closest('.kotak-pertandingan');
            if(!matchBox) { // If player is in the main player list
                this.remove(); 
                saveState();
                return;
            }
            const isFinished = wadahPertandinganSelesai.contains(matchBox);
            const isBeingEdited = matchBox.querySelector('.tombol-save-match');
            if (!isFinished || isBeingEdited) { this.remove(); }
        };
    });
    document.querySelectorAll('.kotak-pertandingan').forEach(matchBox => {
        const matchId = parseInt(matchBox.id.split('-')[1]);
        if (!matchId) return;
        const tombolSelesai = matchBox.querySelector('.tombol-selesai-match');
        if (tombolSelesai && !tombolSelesai.onclick) tombolSelesai.onclick = () => selesaiMatch(matchId);
        const tombolHapus = matchBox.querySelector('.tombol-hapus-match');
        if (tombolHapus && !tombolHapus.onclick) tombolHapus.onclick = () => hapusMatch(matchId);
        const tombolEdit = matchBox.querySelector('.tombol-edit-match');
        if (tombolEdit && !tombolEdit.onclick) tombolEdit.onclick = () => editMatch(matchId);
        const tombolSave = matchBox.querySelector('.tombol-save-match');
        if (tombolSave && !tombolSave.onclick) tombolSave.onclick = () => saveMatch(matchId);
    });
}


// =====================================================================
// CLUB & DAY MANAGEMENT
// =====================================================================
tombolTambahKlubBaru.addEventListener('click', async () => {
    const namaKlub = prompt("Enter new club name:");
    if (!namaKlub || namaKlub.trim() === '') return;

    const passwordKlub = prompt(`Enter a password for the club "${namaKlub.trim()}":`);
    if (!passwordKlub) return;

    tennisAppClubs.push({
        clubId: Date.now(),
        clubName: namaKlub.trim(),
        clubPassword: passwordKlub,
        days: []
    });
    renderDaftarKlub();
    await saveState();
});

function renderDaftarKlub() {
    containerDaftarKlub.innerHTML = '';
    if (tennisAppClubs && tennisAppClubs.length > 0) {
        tennisAppClubs.forEach(club => {
            const itemContainer = document.createElement('div');
            itemContainer.className = 'klub-item-container';
            itemContainer.onclick = (event) => {
                if (!event.target.closest('.tombol-pengaturan-klub, .menu-aksi-klub')) {
                    muatKlub(club.clubId);
                }
            };

            const namaSpan = document.createElement('span');
            namaSpan.className = 'nama-klub-item';
            namaSpan.textContent = club.clubName;

            const tombolPengaturan = document.createElement('button');
            tombolPengaturan.className = 'tombol-pengaturan-klub';
            tombolPengaturan.innerHTML = '&#9881;'; // Simbol gerigi ⚙️
            tombolPengaturan.onclick = (event) => toggleMenuAksi(event, club.clubId);

            const menuAksi = document.createElement('div');
            menuAksi.className = 'menu-aksi-klub';
            menuAksi.id = `menu-aksi-${club.clubId}`;
            menuAksi.innerHTML = `
                <a href="#" onclick="renameKlub(${club.clubId}, event)">Rename</a>
                <a href="#" onclick="ubahPasswordKlub(${club.clubId}, event)">Change Password</a>
                <a href="#" onclick="hapusKlub(${club.clubId}, event)" class="menu-aksi-hapus">Delete</a>
            `;

            menuAksi.addEventListener('click', (event) => {
                event.stopPropagation();
            });

            itemContainer.appendChild(namaSpan);
            itemContainer.appendChild(tombolPengaturan);
            itemContainer.appendChild(menuAksi);
            containerDaftarKlub.appendChild(itemContainer);
        });
    } else {
        containerDaftarKlub.innerHTML = '<p>No clubs found. Create a new club to begin.</p>';
    }
}

function toggleMenuAksi(event, clubId) {
    event.stopPropagation();
    const currentMenu = document.getElementById(`menu-aksi-${clubId}`);
    const currentContainer = currentMenu.closest('.klub-item-container');

    // Close other menus and reset their container's z-index
    document.querySelectorAll('.menu-aksi-klub').forEach(menu => {
        if (menu.id !== `menu-aksi-${clubId}`) {
            menu.style.display = 'none';
            const container = menu.closest('.klub-item-container');
            if (container) container.style.zIndex = 'auto';
        }
    });

    // Toggle the current menu and its container's z-index
    if (currentMenu.style.display === 'block') {
        currentMenu.style.display = 'none';
        if (currentContainer) currentContainer.style.zIndex = 'auto';
    } else {
        currentMenu.style.display = 'block';
        if (currentContainer) currentContainer.style.zIndex = '100'; // High value to ensure it's on top
    }
}

function hapusKlub(clubId, event) {
    if (event) event.stopPropagation();
    const club = tennisAppClubs.find(c => c.clubId === clubId);
    if (!club) return;
    
    const password = prompt(`To delete "${club.clubName}", please enter its password:`);
    if (password === club.clubPassword) {
        if (confirm('Are you sure you want to permanently delete this club?')) {
            tennisAppClubs = tennisAppClubs.filter(c => c.clubId !== clubId);
            renderDaftarKlub();
            saveState();
        }
    } else if (password !== null) {
        alert('Incorrect password!');
    }
}

function renameKlub(clubId, event) {
    if (event) event.stopPropagation();
    const club = tennisAppClubs.find(c => c.clubId === clubId);
    if (!club) return;

    const password = prompt(`To rename "${club.clubName}", please enter its password:`);
    if (password === club.clubPassword) {
        const namaBaru = prompt("Enter the new club name:", club.clubName);
        if (namaBaru && namaBaru.trim() !== '') {
            club.clubName = namaBaru.trim();
            renderDaftarKlub();
            saveState();
        }
    } else if (password !== null) {
        alert('Incorrect password!');
    }
}

function ubahPasswordKlub(clubId, event) {
    if (event) event.stopPropagation();
    const club = tennisAppClubs.find(c => c.clubId === clubId);
    if (!club) return;

    const oldPassword = prompt(`To change the password for "${club.clubName}", please enter the old password:`);
    if (oldPassword === null) return;

    if (oldPassword !== club.clubPassword) {
        return alert('Incorrect old password!');
    }

    const newPassword = prompt("Enter the new password:");
    if (!newPassword) {
        return alert("New password cannot be empty.");
    }

    const confirmPassword = prompt("Enter the new password again to confirm:");
    if (newPassword !== confirmPassword) {
        return alert("The new passwords do not match. Please try again.");
    }

    club.clubPassword = newPassword;
    saveState();
    alert("Password changed successfully!");
}

function muatKlub(clubId) {
    const club = tennisAppClubs.find(c => c.clubId === clubId);
    if (!club) return;

    const password = prompt(`Enter password to open "${club.clubName}":`);
    if (password === club.clubPassword) {
        activeClubId = clubId;
        displayNamaKlubDiDaftarHari.textContent = club.clubName;
        renderDaftarHari();
        tampilkanHalaman('halaman-daftar-hari');
    } else if (password !== null) {
        alert('Incorrect password!');
    }
}

kembaliKeDaftarKlub.addEventListener('click', () => {
    activeClubId = null;
    tampilkanHalaman('halaman-daftar-klub');
});

tombolTambahHariBaru.addEventListener('click', () => {
    const club = getActiveClub();
    if (!club) return;
    if(!club.days) club.days = [];
    const batasanHari = 10;
    if (club.days.length >= batasanHari) {
        alert(`You have reached the maximum of ${batasanHari} days for the free version. Please contact the developer to upgrade.`);
        return; 
    }
    const nomorHariBaru = (club.days.length || 0) + 1;
    club.days.push({ id: Date.now(), name: `Day ${nomorHariBaru}`, type: null, players: [], matchResults: [], matchesHTML: { active: '', finished: '' }, nextMatchNum: 1 });
    renderDaftarHari();
    saveState();
});

function renderDaftarHari() {
    const club = getActiveClub();
    containerDaftarHari.innerHTML = '';
    if (club && club.days && club.days.length > 0) {
        club.days.forEach(day => {
            const container = document.createElement('div');
            container.className = 'hari-item-container';
            
            const contentWrapper = document.createElement('div');
            contentWrapper.className = 'hari-item-content';
            contentWrapper.onclick = () => muatHari(day.id); 

            const tombolHari = document.createElement('span');
            tombolHari.textContent = day.name;
            tombolHari.className = 'nama-hari';
            
            const actionButtons = document.createElement('div');
            actionButtons.className = 'hari-action-buttons';

            const tombolRename = document.createElement('button');
            tombolRename.innerHTML = '&#9998;';
            tombolRename.className = 'tombol-rename-hari';
            tombolRename.onclick = (e) => { e.stopPropagation(); renameHari(day.id); };

            const tombolHapus = document.createElement('button');
            tombolHapus.innerHTML = '&times;';
            tombolHapus.className = 'tombol-hapus-hari';
            tombolHapus.onclick = (e) => { e.stopPropagation(); hapusHari(day.id); };

            contentWrapper.appendChild(tombolHari);
            actionButtons.appendChild(tombolRename);
            actionButtons.appendChild(tombolHapus);
            
            container.appendChild(contentWrapper);
            container.appendChild(actionButtons); 
            containerDaftarHari.appendChild(container);
        });
    } else {
        containerDaftarHari.innerHTML = `<p>No tournament days yet. Click the button below to start.</p>`;
    }
}


function hapusHari(dayId) {
    const club = getActiveClub();
    if (!club || !confirm('Are you sure you want to delete this day and all its matches?')) return;
    const index = club.days.findIndex(day => day.id === dayId);
    if (index > -1) {
        club.days.splice(index, 1);
        renderDaftarHari();
        saveState();
    }
}

function renameHari(dayId) {
    const club = getActiveClub();
    if (!club) return;
    const day = club.days.find(d => d.id === dayId);
    if (!day) return;
    const namaBaru = prompt("Enter the new name for the day:", day.name);
    if (namaBaru && namaBaru.trim() !== '') {
        day.name = namaBaru.trim();
        renderDaftarHari();
        saveState();
    }
}

function muatHari(dayId) {
    activeDayId = dayId;
    const club = getActiveClub();
    const dayData = getActiveDay();
    if (!club || !dayData) return;
    displayNamaKlubDiUtama.textContent = club.clubName;
    judulHariAktif.textContent = dayData.name;
    daftarPemain.innerHTML = '';
    dayData.players.forEach(p => createPlayerElement(p));
    wadahPertandingan.innerHTML = dayData.matchesHTML.active;
    wadahPertandinganSelesai.innerHTML = dayData.matchesHTML.finished;
    if (dayData.type) {
        pilihanTipePertandingan.classList.add('hidden');
        setupPemainDanMatch.classList.remove('hidden');
        tombolTambahMatch.classList.remove('hidden');
    } else {
        pilihanTipePertandingan.classList.remove('hidden');
        setupPemainDanMatch.classList.add('hidden');
        tombolTambahMatch.classList.add('hidden');
    }
    tampilkanHalaman('halaman-utama');
    pasangUlangEventListeners();
}
kembaliKeDaftarHari.addEventListener('click', () => {
    activeDayId = null;
    saveState();
    tampilkanHalaman('halaman-daftar-hari');
});
tombolSingle.addEventListener('click', () => handleTipeDipilih('single'));
tombolDouble.addEventListener('click', () => handleTipeDipilih('double'));
function handleTipeDipilih(tipe) {
    const day = getActiveDay(); if (!day) return;
    day.type = tipe;
    pilihanTipePertandingan.classList.add('hidden');
    tambahMatchBaru();
    setupPemainDanMatch.classList.remove('hidden');
    tombolTambahMatch.classList.remove('hidden');
}
tombolTambahPemain.addEventListener('click', () => {
    const namaPemain = inputNamaPemain.value;
    if (namaPemain.trim() !== '') {
        const daftarPemainSaatIni = Array.from(daftarPemain.querySelectorAll('.item-pemain')).map(p => p.textContent);
        if (daftarPemainSaatIni.includes(namaPemain)) {
            alert('Player name already exists in the list!');
            return;
        }
        createPlayerElement(namaPemain);
        inputNamaPemain.value = '';
        saveState();
    }
});
tombolTambahMatch.addEventListener('click', tambahMatchBaru);
function tambahMatchBaru() {
    const day = getActiveDay(); if (!day) return;
    const matchId = Date.now();
    gambarPertandingan(matchId, day.nextMatchNum, day.type);
    day.nextMatchNum++;
    saveState();
}

/**
 * KODE INI DIPERBAIKI UNTUK MENGATASI BUG TOMBOL SAVE
 * Helper function to ensure the action buttons wrapper exists in a match header.
 * This handles old data that might not have the wrapper.
 * @param {HTMLElement} matchHeader - The .match-header element.
 * @returns {HTMLElement} - The .match-actions-wrapper element.
 */
function ensureActionsWrapper(matchHeader) {
    let actionsWrapper = matchHeader.querySelector('.match-actions-wrapper');
    if (!actionsWrapper) {
        actionsWrapper = document.createElement('div');
        actionsWrapper.className = 'match-actions-wrapper';
        
        // MIGRASI: Cari tombol-tombol aksi lama yang mungkin ada di luar wrapper
        const oldDeleteBtn = matchHeader.querySelector('.tombol-hapus-match');
        if (oldDeleteBtn && oldDeleteBtn.parentElement === matchHeader) {
            actionsWrapper.appendChild(oldDeleteBtn);
        }
        const oldEditBtn = matchHeader.querySelector('.tombol-edit-match');
        if (oldEditBtn && oldEditBtn.parentElement === matchHeader) {
            actionsWrapper.appendChild(oldEditBtn);
        }
        
        matchHeader.appendChild(actionsWrapper);
    }
    return actionsWrapper;
}

function gambarPertandingan(matchId, matchNum, tipe) {
    // Menambahkan div khusus untuk tombol aksi (edit, save, hapus)
    const actionsHTML = `
    <div class="match-actions">
        <button class="match-action-btn tombol-hapus-match" onclick="hapusMatch(${matchId})">&times;</button>
    </div>
`;

    let htmlPertandingan = '';
    const slotAttrs = `class="slot-pemain" ondragover="allowDrop(event)" ondrop="drop(event)"`;
    const inputType = `type="number" class="input-skor" placeholder="Skor"`;

    if (tipe === 'single') {
        htmlPertandingan = `
            <div class="kotak-pertandingan" id="match-${matchId}">
                ${actionsHTML}
                <p class="judul-match">MATCH ${matchNum} (SINGLE)</p>
                <div class="match-layout-container">
                    <div class="tim tim-kiri"><div ${slotAttrs}></div></div>
                    <div class="vs-separator">VS</div>
                    <div class="tim tim-kanan"><div ${slotAttrs}></div></div>
                </div>
                <div class="kolom-skor">
                    <input ${inputType}>
                    <span>-</span>
                    <input ${inputType}>
                </div>
                <button class="tombol-selesai-match" onclick="selesaiMatch(${matchId})">Finish Match</button>
            </div>`;
    } else {
        htmlPertandingan = `
            <div class="kotak-pertandingan" id="match-${matchId}">
                ${actionsHTML}
                <p class="judul-match">MATCH ${matchNum} (DOUBLE)</p>
                <div class="match-layout-container">
                    <div class="tim tim-kiri"><div class="tim-slot"><div ${slotAttrs}></div><div ${slotAttrs}></div></div></div>
                    <div class="vs-separator">VS</div>
                    <div class="tim tim-kanan"><div class="tim-slot"><div ${slotAttrs}></div><div ${slotAttrs}></div></div></div>
                </div>
                <div class="kolom-skor">
                    <input ${inputType}>
                    <span>-</span>
                    <input ${inputType}>
                </div>
                <button class="tombol-selesai-match" onclick="selesaiMatch(${matchId})">Finish Match</button>
            </div>`;
    }
    wadahPertandingan.insertAdjacentHTML('afterbegin', htmlPertandingan);
}

function selesaiMatch(matchId) {
    const day = getActiveDay(); if (!day) return;
    const matchBox = document.getElementById(`match-${matchId}`);
    
    // Validasi
    const semuaPemain = matchBox.querySelectorAll('.slot-pemain .item-pemain');
    const semuaSkor = matchBox.querySelectorAll('.input-skor');
    if (semuaSkor[0].value.trim() === '' || semuaSkor[1].value.trim() === '') {
        return alert('Isi skor untuk kedua tim!');
    }
    const isSingle = !matchBox.querySelector('.tim-slot');
    if ((isSingle && semuaPemain.length < 2) || (!isSingle && semuaPemain.length < 4)) {
        return alert('Lengkapi semua pemain di slot pertandingan!');
    }

    // Proses data
    const tim = matchBox.querySelectorAll('.tim');
    const pemainTim1 = Array.from(tim[0].querySelectorAll('.item-pemain')).map(p => p.textContent).join(' & ');
    const pemainTim2 = Array.from(tim[1].querySelectorAll('.item-pemain')).map(p => p.textContent).join(' & ');
    const skor = Array.from(semuaSkor).map(s => s.value).join(' - ');
    const matchNum = parseInt(matchBox.querySelector('.judul-match').textContent.match(/\d+/)[0]);
    
    day.matchResults.push({ id: matchId, matchNum, tim1: pemainTim1, tim2: pemainTim2, skor });
    
    wadahPertandinganSelesai.appendChild(matchBox);
    matchBox.querySelector('.tombol-selesai-match').remove();
    semuaSkor.forEach(input => input.disabled = true);
    
    // BUAT TOMBOL EDIT
    const actionContainer = matchBox.querySelector('.match-actions');
    const tombolEdit = document.createElement('button');
    tombolEdit.innerHTML = '&#9998;';
    tombolEdit.className = 'match-action-btn tombol-edit-match';
    tombolEdit.onclick = () => editMatch(matchId);
    actionContainer.appendChild(tombolEdit);
    
    saveState();
}


// === FUNGSI DIPERBAIKI DI SINI ===
function editMatch(matchId) {
    const matchBox = document.getElementById(`match-${matchId}`);
    const skorInputs = matchBox.querySelectorAll('.input-skor');
    skorInputs.forEach(input => {
        input.disabled = false;
        input.style.border = "2px solid var(--primary-color)";
    });
    
    // HAPUS TOMBOL EDIT, BUAT TOMBOL SAVE
    const actionContainer = matchBox.querySelector('.match-actions');
    actionContainer.querySelector('.tombol-edit-match').remove();
    
    const tombolSave = document.createElement('button');
    tombolSave.textContent = 'Save';
    tombolSave.className = 'tombol-save-match';
    tombolSave.onclick = () => saveMatch(matchId);
    actionContainer.appendChild(tombolSave);
}

// === FUNGSI DIPERBAIKI DI SINI ===
function saveMatch(matchId) {
    const day = getActiveDay(); if (!day) return;
    const matchBox = document.getElementById(`match-${matchId}`);
    const skorInputs = matchBox.querySelectorAll('.input-skor');
    
    if (skorInputs[0].value.trim() === '' || skorInputs[1].value.trim() === '') {
        return alert('Skor tidak boleh kosong!');
    }

    const skorBaru = Array.from(skorInputs).map(s => s.value).join(' - ');
    const indexPertandingan = day.matchResults.findIndex(hasil => hasil.id === matchId);
    if (indexPertandingan > -1) {
        day.matchResults[indexPertandingan].skor = skorBaru;
    }
    
    skorInputs.forEach(input => {
        input.disabled = true;
        input.style.border = "1px solid var(--border-color)";
    });
    
    // HAPUS TOMBOL SAVE, BUAT KEMBALI TOMBOL EDIT
    const actionContainer = matchBox.querySelector('.match-actions');
    actionContainer.querySelector('.tombol-save-match').remove();
    
    const tombolEdit = document.createElement('button');
    tombolEdit.innerHTML = '&#9998;';
    tombolEdit.className = 'tombol-edit-match';
    tombolEdit.onclick = () => editMatch(matchId);
    actionContainer.appendChild(tombolEdit);
    
    saveState();
}

function hapusMatch(matchId) {
    if (!confirm('Are you sure you want to delete this match?')) { return; }
    const matchBox = document.getElementById(`match-${matchId}`);
    if (matchBox) { matchBox.remove(); }
    const day = getActiveDay();
    if (day) {
        const indexResult = day.matchResults.findIndex(hasil => hasil.id === matchId);
        if (indexResult > -1) { day.matchResults.splice(indexResult, 1); }
    }
    nomorUlangMatch();
    saveState();
}
function nomorUlangMatch() {
    const day = getActiveDay(); if (!day) return;
    const semuaMatchBoxes = [ ...wadahPertandingan.querySelectorAll('.kotak-pertandingan'), ...wadahPertandinganSelesai.querySelectorAll('.kotak-pertandingan')];
    semuaMatchBoxes.sort((a, b) => {
        const idA = parseInt(a.id.split('-')[1]);
        const idB = parseInt(b.id.split('-')[1]);
        return idA - idB;
    });
    semuaMatchBoxes.forEach((box, index) => {
        const nomorBaru = index + 1;
        const judulMatch = box.querySelector('.judul-match');
        if (judulMatch) { judulMatch.textContent = judulMatch.textContent.replace(/MATCH \d+/, `MATCH ${nomorBaru}`); }
        const matchId = parseInt(box.id.split('-')[1]);
        const resultData = day.matchResults.find(r => r.id === matchId);
        if (resultData) { resultData.matchNum = nomorBaru; }
    });
    day.nextMatchNum = semuaMatchBoxes.length + 1;
}

// =====================================================================
// STANDINGS PAGE FUNCTIONS & EVENT LISTENERS
// =====================================================================
kembaliDariKlasemen.addEventListener('click', () => {
    tampilkanHalaman('halaman-daftar-hari');
});
tombolLihatKlasemen.addEventListener('click', () => {
    const club = getActiveClub();
    if (!club) return;
    displayNamaKlubDiKlasemen.textContent = club.clubName;
    populateFilterHari(); 
    tampilkanKlasemen(); 
    tampilkanHalaman('halaman-klasemen-umum');
});
tombolShareKlasemen.addEventListener('click', () => {
    const containerKlasemen = document.getElementById('container-klasemen-umum');
    const originalButtonText = tombolShareKlasemen.textContent;
    const filterDropdown = document.getElementById('filter-hari');
    const selectedOption = filterDropdown.options[filterDropdown.selectedIndex];
    const titleElement = document.createElement('h3');
    titleElement.textContent = selectedOption.text;
    titleElement.style.textAlign = 'center';
    titleElement.style.marginBottom = '1rem';
    titleElement.style.color = '#343a40';
    titleElement.style.fontWeight = '600';
    containerKlasemen.prepend(titleElement);
    tombolShareKlasemen.textContent = 'Generating...';
    tombolShareKlasemen.disabled = true;
    const originalContainerStyle = containerKlasemen.style.cssText;
    const originalTableStyle = containerKlasemen.querySelector('table') ? containerKlasemen.querySelector('table').style.cssText : '';
    containerKlasemen.style.width = 'fit-content';
    containerKlasemen.style.maxWidth = 'none';
    if (containerKlasemen.querySelector('table')) {
        containerKlasemen.querySelector('table').style.width = 'auto';
        containerKlasemen.querySelector('table').style.maxWidth = 'none';
    }
    const desiredWidth = Math.max(containerKlasemen.offsetWidth, 700);
    html2canvas(containerKlasemen, {
        scale: 2,
        width: desiredWidth,
    }).then(canvas => {
        const fileNameText = selectedOption.text.replace(/ /g, '_').toLowerCase();
        const fileName = `standings_${fileNameText}.png`;
        const link = document.createElement('a');
        link.download = fileName;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }).finally(() => {
        containerKlasemen.style.cssText = originalContainerStyle;
        if (containerKlasemen.querySelector('table')) {
            containerKlasemen.querySelector('table').style.cssText = originalTableStyle;
        }
        titleElement.remove();
        tombolShareKlasemen.textContent = originalButtonText;
        tombolShareKlasemen.disabled = false;
    });
});
function populateFilterHari() {
    const club = getActiveClub();
    const filterDropdown = document.getElementById('filter-hari');
    filterDropdown.innerHTML = ''; 
    filterDropdown.innerHTML += `<option value="overall">Overall (All Days)</option>`;
    if (club && club.days) {
        club.days.forEach(day => {
            filterDropdown.innerHTML += `<option value="${day.id}">${day.name}</option>`;
        });
    }
    filterDropdown.onchange = () => tampilkanKlasemen();
}
function tampilkanKlasemen() {
    const club = getActiveClub();
    const filterValue = document.getElementById('filter-hari').value;
    let semuaPertandingan = [];
    if (filterValue === 'overall') {
        club.days.forEach(day => {
            semuaPertandingan.push(...day.matchResults);
        });
    } else {
        const selectedDay = club.days.find(d => d.id == filterValue);
        if (selectedDay) {
            semuaPertandingan = selectedDay.matchResults;
        }
    }
    const statistikPemain = {};
    semuaPertandingan.forEach(match => {
        const skor = match.skor.split('-').map(s => parseInt(s.trim()));
        if (skor.length < 2 || isNaN(skor[0]) || isNaN(skor[1])) return;
        const pemainTim1 = match.tim1.split('&').map(p => p.trim());
        const pemainTim2 = match.tim2.split('&').map(p => p.trim());
        const skorTim1 = skor[0];
        const skorTim2 = skor[1];
        const allPlayers = [...pemainTim1, ...pemainTim2];
        allPlayers.forEach(namaPemain => {
            const key = namaPemain.toLowerCase();
            if (!statistikPemain[key]) {
                statistikPemain[key] = {
                    originalName: namaPemain,
                    setDimainkan: 0,
                    setMenang: 0
                };
            }
        });
        pemainTim1.forEach(p => {
            const key = p.toLowerCase();
            statistikPemain[key].setDimainkan += skorTim1 + skorTim2;
            statistikPemain[key].setMenang += skorTim1;
        });
        pemainTim2.forEach(p => {
            const key = p.toLowerCase();
            statistikPemain[key].setDimainkan += skorTim1 + skorTim2;
            statistikPemain[key].setMenang += skorTim2;
        });
    });
    const dataKlasemen = Object.values(statistikPemain).map(stats => {
        const setKalah = stats.setDimainkan - stats.setMenang;
        const winPercentage = stats.setDimainkan > 0 ? (stats.setMenang / stats.setDimainkan) * 100 : 0;
        const poin = stats.setMenang * 10;
        return {
            nama: stats.originalName,
            setDimainkan: stats.setDimainkan,
            setMenang: stats.setMenang,
            setKalah,
            winPercentage,
            poin
        };
    });
    dataKlasemen.sort((a, b) => b.poin - a.poin || b.winPercentage - a.winPercentage);
    renderTabelKlasemen(dataKlasemen);
}
function renderTabelKlasemen(data) {
    const container = document.getElementById('container-klasemen-umum');
    if (data.length === 0) {
        container.innerHTML = '<p>No finished matches to display.</p>';
        return;
    }
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Rk</th>
                    <th>Player</th>
                    <th>Pld</th>
                    <th>Won</th>
                    <th>Lost</th>
                    <th>W%</th>
                    <th>Pts</th>
                </tr>
            </thead>
            <tbody>
    `;
    data.forEach((pemain, index) => {
        tableHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${pemain.nama}</td>
                <td>${pemain.setDimainkan}</td>
                <td>${pemain.setMenang}</td>
                <td>${pemain.setKalah}</td>
                <td>${pemain.winPercentage.toFixed(1)}%</td>
                <td>${pemain.poin}</td>
            </tr>
        `;
    });
    tableHTML += `</tbody></table>`;
    container.innerHTML = tableHTML;
}

// =====================================================================
// INITIAL LOAD
// =====================================================================
initializeApp();
