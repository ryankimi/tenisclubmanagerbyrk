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
let activeUser = null; 

// Pages
const semuaHalaman = document.querySelectorAll('.page');
const halamanAutentikasi = document.getElementById('halaman-autentikasi');
const halamanDaftarKlub = document.getElementById('halaman-daftar-klub');
const halamanDaftarHari = document.getElementById('halaman-daftar-hari');
const halamanUtama = document.getElementById('halaman-utama');
const halamanKlasemenUmum = document.getElementById('halaman-klasemen-umum');

// Auth Elements
const formLogin = document.getElementById('form-login');
const formRegister = document.getElementById('form-register');
const tombolLogin = document.getElementById('tombol-login');
const tombolRegister = document.getElementById('tombol-register');
const linkKeRegister = document.getElementById('link-ke-register');
const linkKeLogin = document.getElementById('link-ke-login');
const tombolLogout = document.getElementById('tombol-logout');

// Club List Page Elements
const containerDaftarKlub = document.getElementById('container-daftar-klub');
const tombolTambahKlubBaru = document.getElementById('tombol-tambah-klub-baru');
const tombolResetTotal = document.getElementById('tombol-reset-total');

// Day List Page Elements
const kembaliKeDaftarKlub = document.getElementById('kembali-ke-daftar-klub');
const displayNamaKlubDiDaftarHari = document.getElementById('display-nama-klub-di-daftar-hari');
const containerDaftarHari = document.getElementById('container-daftar-hari');
const tombolTambahHariBaru = document.getElementById('tombol-tambah-hari-baru');
const tombolLihatKlasemen = document.getElementById('tombol-lihat-klasemen');

// Main Setup Page Elements
// PERBAIKAN: Baris duplikat dihapus dari sini.
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
// AUTHENTICATION & API FUNCTIONS
// =====================================================================
linkKeRegister.addEventListener('click', (e) => { e.preventDefault(); formLogin.classList.add('hidden'); formRegister.classList.remove('hidden'); });
linkKeLogin.addEventListener('click', (e) => { e.preventDefault(); formRegister.classList.add('hidden'); formLogin.classList.remove('hidden'); });

tombolRegister.addEventListener('click', async () => {
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value.trim();
    if (!username || !password) return alert("Username and password cannot be empty.");

    try {
        const data = await loadFromJSONBin();
        if (data.users && data.users[username]) {
            return alert("Username already exists. Please choose another one.");
        }
        if (!data.users) data.users = {};
        data.users[username] = { password: password, clubsData: [] };
        await saveToJSONBin(data);
        alert("Registration successful! You can now log in.");
        formRegister.classList.add('hidden');
        formLogin.classList.remove('hidden');
    } catch (error) {
        alert("Registration failed. Could not connect to the database.");
        console.error("Error during registration:", error);
    }
});

tombolLogin.addEventListener('click', async () => {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    if (!username || !password) return alert("Username and password cannot be empty.");

    try {
        const data = await loadFromJSONBin();
        const userData = data.users ? data.users[username] : undefined;

        if (userData && userData.password === password) {
            activeUser = username;
            tennisAppClubs = userData.clubsData || [];
            renderDaftarKlub();
            tampilkanHalaman('halaman-daftar-klub');
        } else {
            alert("Invalid username or password.");
        }
    } catch (error) {
        alert("Login failed. Could not connect to the database.");
        console.error("Error during login:", error);
    }
});

tombolLogout.addEventListener('click', () => {
    activeUser = null;
    tennisAppClubs = [];
    activeClubId = null;
    activeDayId = null;
    tampilkanHalaman('halaman-autentikasi');
});

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
            console.log("Bin not found, creating a new one.");
            await saveToJSONBin({ users: {} });
            return { users: {} };
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
    if (!activeUser) return;
    
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
        const allData = await loadFromJSONBin();
        if (!allData.users) allData.users = {};
        allData.users[activeUser].clubsData = tennisAppClubs;
        await saveToJSONBin(allData);
    } catch (error) {
        console.error("Error saving state:", error);
    }
}

async function initializeApp() {
    try {
        await loadFromJSONBin(); // Cukup panggil untuk memastikan bin ada
        tampilkanHalaman('halaman-autentikasi');
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
function drop(event) {
    event.preventDefault();
    const namaPemain = event.dataTransfer.getData('text/plain');
    if (namaPemain && event.target.classList.contains('slot-pemain') && event.target.children.length === 0) {
        const elemenBaruDiSlot = document.createElement('div');
        elemenBaruDiSlot.textContent = namaPemain;
        elemenBaruDiSlot.className = 'item-pemain';
        pasangUlangEventListeners();
        event.target.appendChild(elemenBaruDiSlot);
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
        if (pemainDiSlot.onclick) return;
        pemainDiSlot.onclick = function() {
            const matchBox = this.closest('.kotak-pertandingan');
            if(!matchBox) return;
            const isFinished = wadahPertandinganSelesai.contains(matchBox);
            const isBeingEdited = matchBox.querySelector('.tombol-save-match');
            if (!isFinished || isBeingEdited) { this.remove(); }
        };
    });
    document.querySelectorAll('.kotak-pertandingan').forEach(matchBox => {
        const matchId = parseInt(matchBox.id.split('-')[1]);
        if (!matchId) return;
        const tombolSelesai = matchBox.querySelector('.tombol-selesai-match');
        if (tombolSelesai) tombolSelesai.onclick = () => selesaiMatch(matchId);
        const tombolHapus = matchBox.querySelector('.tombol-hapus-match');
        if (tombolHapus) tombolHapus.onclick = () => hapusMatch(matchId);
        const tombolEdit = matchBox.querySelector('.tombol-edit-match');
        if (tombolEdit) tombolEdit.onclick = () => editMatch(matchId);
        const tombolSave = matchBox.querySelector('.tombol-save-match');
        if (tombolSave) tombolSave.onclick = () => saveMatch(matchId);
    });
}
tombolTambahKlubBaru.addEventListener('click', async () => {
    const namaKlub = prompt("Enter new club name:");
    if (namaKlub && namaKlub.trim() !== '') {
        tennisAppClubs.push({ clubId: Date.now(), clubName: namaKlub.trim(), days: [] });
        renderDaftarKlub();
        await saveState();
    }
});
tombolResetTotal.addEventListener('click', async () => {
    if (confirm('Are you sure you want to delete ALL users and data? This action cannot be undone.')) {
        await saveToJSONBin({ users: {} });
        location.reload();
    }
});
function renderDaftarKlub() {
    containerDaftarKlub.innerHTML = '';
    if (tennisAppClubs && tennisAppClubs.length > 0) {
        tennisAppClubs.forEach(club => {
            const itemHTML = `<div class="klub-item-container"><span class="nama-klub-item">${club.clubName}</span><div class="klub-item-actions"><button onclick="renameKlub(${club.clubId})">&#9998;</button><button class="tombol-buka-klub" onclick="muatKlub(${club.clubId})">Open</button><button class="tombol-hapus-hari" onclick="hapusKlub(${club.clubId})">&times;</button></div></div>`;
            containerDaftarKlub.insertAdjacentHTML('beforeend', itemHTML);
        });
    } else {
        containerDaftarKlub.innerHTML = '<p>No clubs found. Create a new club to begin.</p>';
    }
}
function hapusKlub(clubId) {
    if (confirm('Are you sure you want to delete this club and all its data?')) {
        tennisAppClubs = tennisAppClubs.filter(club => club.clubId !== clubId);
        renderDaftarKlub();
        saveState();
    }
}
function renameKlub(clubId) {
    const club = tennisAppClubs.find(c => c.clubId === clubId);
    if (!club) return;
    const namaBaru = prompt("Enter the new club name:", club.clubName);
    if (namaBaru && namaBaru.trim() !== '') {
        club.clubName = namaBaru.trim();
        renderDaftarKlub();
        saveState();
    }
}
function muatKlub(clubId) {
    activeClubId = clubId;
    const club = getActiveClub();
    if (!club) return;
    displayNamaKlubDiDaftarHari.textContent = club.clubName;
    renderDaftarHari();
    tampilkanHalaman('halaman-daftar-hari');
}
kembaliKeDaftarKlub.addEventListener('click', () => {
    activeClubId = null;
    tampilkanHalaman('halaman-daftar-klub');
});
tombolTambahHariBaru.addEventListener('click', () => {
    const club = getActiveClub();
    if (!club) return;
    if(!club.days) club.days = [];
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
            const tombolHari = document.createElement('button');
            tombolHari.textContent = day.name;
            tombolHari.className = 'tombol-hari';
            tombolHari.onclick = () => muatHari(day.id);
            const tombolRename = document.createElement('button');
            tombolRename.innerHTML = '&#9998;';
            tombolRename.className = 'tombol-rename-hari';
            tombolRename.onclick = () => renameHari(day.id);
            const tombolHapus = document.createElement('button');
            tombolHapus.innerHTML = '&times;';
            tombolHapus.className = 'tombol-hapus-hari';
            tombolHapus.onclick = () => hapusHari(day.id);
            container.appendChild(tombolHari);
            container.appendChild(tombolRename);
            container.appendChild(tombolHapus);
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
function gambarPertandingan(matchId, matchNum, tipe) {
    const tombolHapusHTML = `<button class="tombol-hapus-match">&times;</button>`;
    let htmlPertandingan = '';
    if (tipe === 'single') {
        htmlPertandingan = `<div class="kotak-pertandingan" id="match-${matchId}">${tombolHapusHTML}<p class="judul-match">MATCH ${matchNum} (SINGLE)</p><div class="match-layout-container"><div class="tim tim-kiri"><div class="slot-pemain" ondragover="allowDrop(event)" ondrop="drop(event)"></div></div><div class="vs-separator">VS</div><div class="tim tim-kanan"><div class="slot-pemain" ondragover="allowDrop(event)" ondrop="drop(event)"></div></div></div><div class="kolom-skor"><input type="text" class="input-skor" placeholder="Score"></div><button class="tombol-selesai-match">Finish Match</button></div>`;
    } else {
        htmlPertandingan = `<div class="kotak-pertandingan" id="match-${matchId}">${tombolHapusHTML}<p class="judul-match">MATCH ${matchNum} (DOUBLE)</p><div class="match-layout-container"><div class="tim tim-kiri"><div class="tim-slot"><div class="slot-pemain" ondragover="allowDrop(event)" ondrop="drop(event)"></div><div class="slot-pemain" ondragover="allowDrop(event)" ondrop="drop(event)"></div></div></div><div class="vs-separator">VS</div><div class="tim tim-kanan"><div class="tim-slot"><div class="slot-pemain" ondragover="allowDrop(event)" ondrop="drop(event)"></div><div class="slot-pemain" ondragover="allowDrop(event)" ondrop="drop(event)"></div></div></div></div><div class="kolom-skor"><input type="text" class="input-skor" placeholder="Team 1 Score"><span>-</span><input type="text" class="input-skor" placeholder="Team 2 Score"></div><button class="tombol-selesai-match">Finish Match</button></div>`;
    }
    wadahPertandingan.insertAdjacentHTML('afterbegin', htmlPertandingan);
    pasangUlangEventListeners();
}
function selesaiMatch(matchId) {
    const day = getActiveDay(); if (!day) return;
    const matchBox = document.getElementById(`match-${matchId}`);
    const semuaPemain = matchBox.querySelectorAll('.slot-pemain .item-pemain');
    const semuaSkor = matchBox.querySelectorAll('.input-skor');
    if (semuaPemain.length < 2 || semuaSkor[0].value.trim() === '') return alert('Please fill in all players and scores!');
    const tim = matchBox.querySelectorAll('.tim');
    const pemainTim1 = Array.from(tim[0].querySelectorAll('.item-pemain')).map(p => p.textContent).join(' & ');
    const pemainTim2 = Array.from(tim[1].querySelectorAll('.item-pemain')).map(p => p.textContent).join(' & ');
    const skor = Array.from(semuaSkor).map(s => s.value).join(' - ');
    const matchNum = parseInt(matchBox.querySelector('.judul-match').textContent.match(/\d+/)[0]);
    day.matchResults.push({ id: matchId, matchNum: matchNum, tim1: pemainTim1, tim2: pemainTim2, skor: skor });
    wadahPertandinganSelesai.appendChild(matchBox);
    matchBox.querySelector('.tombol-selesai-match').remove();
    semuaSkor.forEach(input => input.disabled = true);
    const tombolEdit = document.createElement('button');
    tombolEdit.textContent = 'Edit';
    tombolEdit.className = 'tombol-edit-match';
    tombolEdit.onclick = () => editMatch(matchId);
    matchBox.prepend(tombolEdit);
    saveState();
}
function editMatch(matchId) {
    const matchBox = document.getElementById(`match-${matchId}`);
    const skorInputs = matchBox.querySelectorAll('.input-skor');
    skorInputs.forEach(input => { input.disabled = false; input.style.border = "2px solid blue"; });
    matchBox.querySelector('.tombol-edit-match').classList.add('hidden');
    const tombolSave = document.createElement('button');
    tombolSave.textContent = 'Save';
    tombolSave.className = 'tombol-save-match';
    tombolSave.onclick = () => saveMatch(matchId);
    matchBox.prepend(tombolSave);
}
function saveMatch(matchId) {
    const day = getActiveDay(); if (!day) return;
    const matchBox = document.getElementById(`match-${matchId}`);
    const skorInputs = matchBox.querySelectorAll('.input-skor');
    const skorBaru = Array.from(skorInputs).map(s => s.value).join(' - ');
    const indexPertandingan = day.matchResults.findIndex(hasil => hasil.id === matchId);
    if (indexPertandingan > -1) { day.matchResults[indexPertandingan].skor = skorBaru; }
    skorInputs.forEach(input => { input.disabled = true; input.style.border = "1px solid #ccc"; });
    matchBox.querySelector('.tombol-save-match').remove();
    matchBox.querySelector('.tombol-edit-match').classList.remove('hidden');
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

// Event listener untuk tombol kembali dari halaman klasemen
kembaliDariKlasemen.addEventListener('click', () => {
    tampilkanHalaman('halaman-daftar-hari');
});

// Event listener BARU untuk tombol lihat klasemen
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

    // Simpan gaya asli
    const originalContainerStyle = containerKlasemen.style.cssText; 
    const originalTableStyle = containerKlasemen.querySelector('table') ? containerKlasemen.querySelector('table').style.cssText : '';
    
    // Siapkan judul
    const titleElement = document.createElement('h3');
    titleElement.textContent = selectedOption.text;
    titleElement.style.textAlign = 'center';
    titleElement.style.marginBottom = '1rem';
    titleElement.style.color = '#343a40';
    titleElement.style.fontWeight = '600';
    containerKlasemen.prepend(titleElement);

    tombolShareKlasemen.textContent = 'Generating...';
    tombolShareKlasemen.disabled = true;

    // --- Penyesuaian sementara untuk pengambilan gambar ---
    // Atur lebar kontainer dan tabel agar tidak terpotong saat mengambil gambar
    // Kita paksa lebar tertentu yang cukup untuk tabel penuh
    containerKlasemen.style.width = 'fit-content'; 
    containerKlasemen.style.maxWidth = 'none';
    if (containerKlasemen.querySelector('table')) {
        containerKlasemen.querySelector('table').style.width = 'auto'; // Agar tabel tidak terpaksa 100% jika kecil
        containerKlasemen.querySelector('table').style.maxWidth = 'none'; // Hilangkan batasan max-width
    }
    
    // Tentukan lebar gambar yang diinginkan (contoh: 700px atau lebih sesuai kebutuhan)
    const desiredWidth = Math.max(containerKlasemen.offsetWidth, 700); // Ambil lebar aktual atau minimal 700px
    // --- Akhir penyesuaian sementara ---

    html2canvas(containerKlasemen, {
        scale: 2, // Tingkatkan skala untuk kualitas gambar yang lebih baik
        width: desiredWidth, // Paksa lebar output gambar
        // height: containerKlasemen.offsetHeight // Opsional: paksa tinggi output gambar
    }).then(canvas => {
        const fileNameText = selectedOption.text.replace(/ /g, '_').toLowerCase();
        const fileName = `standings_${fileNameText}.png`;

        const link = document.createElement('a');
        link.download = fileName;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }).finally(() => {
        // Kembalikan semua gaya ke kondisi semula
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

    // ---- HEADER DIUBAH UNTUK MENAMBAHKAN KATA "SET" ----
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Rk</th>
                    <th>Player</th>
                    <th>Sets Pld</th>
                    <th>Sets Won</th>
                    <th>Sets Lost</th>
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
