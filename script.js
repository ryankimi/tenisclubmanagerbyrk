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
const halamanDaftarKlub = document.getElementById('halaman-daftar-klub');
const halamanDaftarHari = document.getElementById('halaman-daftar-hari');
const halamanUtama = document.getElementById('halaman-utama');
const halamanKlasemenUmum = document.getElementById('halaman-klasemen-umum');
// Autentikasi
const halamanAutentikasi = document.getElementById('halaman-autentikasi');
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


// =====================================================================
// AUTHENTICATION (LOGIN & REGISTER)
// =====================================================================
// Fungsi untuk beralih antara form login dan register
linkKeRegister.addEventListener('click', () => {
    formLogin.classList.add('hidden');
    formRegister.classList.remove('hidden');
});

linkKeLogin.addEventListener('click', () => {
    formRegister.classList.add('hidden');
    formLogin.classList.remove('hidden');
});

// Penanganan Register dengan JSONBin
tombolRegister.addEventListener('click', async () => {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    if (!username || !password) {
        alert("Username and password cannot be empty.");
        return;
    }

    try {
        const data = await loadFromJSONBin();
        if (data.users[username]) {
            alert("Username already exists. Please choose another one.");
            return;
        }

        data.users[username] = {
            password: password,
            clubsData: []
        };

        await saveToJSONBin(data);
        alert("Registration successful! You can now log in.");
        formRegister.classList.add('hidden');
        formLogin.classList.remove('hidden');
    } catch (error) {
        alert("Registration failed. Please try again later.");
        console.error("Error during registration:", error);
    }
});

// Penanganan Login dengan JSONBin
tombolLogin.addEventListener('click', async () => {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const data = await loadFromJSONBin();
        const userData = data.users[username];

        if (userData && userData.password === password) {
            activeUser = username;
            tennisAppClubs = userData.clubsData || [];
            renderDaftarKlub();
            tampilkanHalaman('halaman-daftar-klub');
            alert("Login successful!");
        } else {
            alert("Invalid username or password.");
        }
    } catch (error) {
        alert("Login failed. Please try again later.");
        console.error("Error during login:", error);
    }
});

// Penanganan Logout
tombolLogout.addEventListener('click', () => {
    activeUser = null;
    tennisAppClubs = [];
    tampilkanHalaman('halaman-autentikasi');
});


// =====================================================================
// JSONBIN API FUNCTIONS
// =====================================================================
async function saveToJSONBin(data) {
    const headers = {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_API_KEY
    };
    const response = await fetch(JSONBIN_API_URL, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save data to JSONBin: ${response.status} - ${errorText}`);
    }
}

async function loadFromJSONBin() {
    const headers = {
        'X-Master-Key': JSONBIN_API_KEY
    };
    const response = await fetch(`${JSONBIN_API_URL}/latest`, {
        headers: headers
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to load data from JSONBin: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    return data.record;
}

// =====================================================================
// CORE FUNCTIONS: NAVIGATION, SAVE, LOAD
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
        allData.users[activeUser].clubsData = tennisAppClubs;
        await saveToJSONBin(allData);
        console.log("Data saved to JSONBin!");
    } catch (error) {
        console.error("Error saving data:", error);
        alert("Failed to save data. Please check your internet connection.");
    }
}

async function loadState() {
    try {
        const data = await loadFromJSONBin();
        if (data.users) {
            tampilkanHalaman('halaman-autentikasi');
        } else {
            const initialData = { users: {} };
            await saveToJSONBin(initialData);
            tampilkanHalaman('halaman-autentikasi');
        }
    } catch (error) {
        // Jika bin kosong atau tidak ditemukan, buat bin baru
        if (error.message.includes('bin not found') || error.message.includes('404')) {
            const initialData = { users: {} };
            await saveToJSONBin(initialData);
            tampilkanHalaman('halaman-autentikasi');
        } else {
            console.error("Error loading initial data:", error);
            alert("Failed to load application data. Please check your internet connection or API key.");
        }
    }
}

// =====================================================================
// DRAG-AND-DROP LOGIC
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

// =====================================================================
// HELPER FUNCTIONS
// =====================================================================
function getActiveClub() {
    return tennisAppClubs.find(c => c.clubId === activeClubId);
}
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
// =====================================================================
// PAGE LOGIC & EVENT LISTENERS
// =====================================================================

// --- Club List Page ---
tombolTambahKlubBaru.addEventListener('click', async () => {
    const namaKlub = prompt("Enter new club name:");
    if (namaKlub && namaKlub.trim() !== '') {
        tennisAppClubs.push({ clubId: Date.now(), clubName: namaKlub.trim(), days: [] });
        renderDaftarKlub();
        await saveState();
    }
});
tombolResetTotal.addEventListener('click', async () => {
    if (confirm('Are you sure you want to delete ALL data? This action cannot be undone.')) {
        await saveToJSONBin({ users: {} });
        location.reload();
    }
});
function renderDaftarKlub() {
    containerDaftarKlub.innerHTML = '';
    if (tennisAppClubs.length > 0) {
        tennisAppClubs.forEach(club => {
            const itemHTML = `
                <div class="klub-item-container">
                    <span class="nama-klub-item">${club.clubName}</span>
                    <div class="klub-item-actions">
                        <button onclick="renameKlub(${club.clubId})">&#9998;</button>
                        <button class="tombol-buka-klub" onclick="muatKlub(${club.clubId})">Open</button>
                        <button class="tombol-hapus-hari" onclick="hapusKlub(${club.clubId})">&times;</button>
                    </div>
                </div>
            `;
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

// --- Day List Page ---
kembaliKeDaftarKlub.addEventListener('click', () => {
    activeClubId = null;
    saveState();
    tampilkanHalaman('halaman-daftar-klub');
});
tombolTambahHariBaru.addEventListener('click', () => {
    const club = getActiveClub();
    if (!club) return;
    const nomorHariBaru = (club.days.length || 0) + 1;
    club.days.push({ id: Date.now(), name: `Day ${nomorHariBaru}`, type: null, players: [], matchResults: [], matchesHTML: { active: '', finished: '' }, nextMatchNum: 1 });
    renderDaftarHari();
    saveState();
});
function renderDaftarHari() {
    const club = getActiveClub();
    containerDaftarHari.innerHTML = '';
    if (club && club.days.length > 0) {
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

// --- Main Setup Page ---
kembaliKeDaftarHari.addEventListener('click', () => {
    activeDayId = null;
    saveState();
    tampilkanHalaman('halaman-daftar-hari');
});
tombolLihatKlasemen.addEventListener('click', () => {
    const club = getActiveClub();
    if (!club) return;
    displayNamaKlubDiKlasemen.textContent = club.clubName;
    renderKlasemenUmum();
    tampilkanHalaman('halaman-klasemen-umum');
});
kembaliDariKlasemen.addEventListener('click', () => tampilkanHalaman('halaman-daftar-hari'));
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
function renderKlasemenUmum() {
    const club = getActiveClub();
    const statistikPemain = {};
    const semuaPemain = new Set();
    if (club && club.days) {
        club.days.forEach(day => {
            day.players.forEach(p => semuaPemain.add(p));
        });
    }
    semuaPemain.forEach(namaPemain => { statistikPemain[namaPemain] = { main: 0, menang: 0, kalah: 0 }; });
    if (club && club.days) {
        club.days.forEach(day => {
            day.matchResults.forEach(hasil => {
                const skorBagian = hasil.skor.split('-');
                if (skorBagian.length < 1) return;
                const setTim1 = skorBagian[0].trim().split(',').filter(s => s).map(s => parseInt(s));
                const setTim2 = skorBagian[1] ? skorBagian[1].trim().split(',').filter(s => s).map(s => parseInt(s)) : [];
                let menangSetTim1 = 0, menangSetTim2 = 0;
                const iterasi = Math.max(setTim1.length, setTim2.length);
                for (let i = 0; i < iterasi; i++) {
                    const s1 = setTim1[i] || 0, s2 = setTim2[i] || 0;
                    if (s1 > s2) menangSetTim1++; if (s2 > s1) menangSetTim2++;
                }
                if (setTim2.length === 0 && setTim1.length > 0 && !isNaN(setTim1[0])) { menangSetTim1 = 1; }
                const pemainTim1 = hasil.tim1.split(' & ').filter(p => p), pemainTim2 = hasil.tim2.split(' & ').filter(p => p);
                if (pemainTim1.length === 0 || pemainTim2.length === 0) return;
                const pemenang = menangSetTim1 > menangSetTim2 ? pemainTim1 : pemainTim2;
                const kalah = menangSetTim1 > menangSetTim2 ? pemainTim2 : pemainTim1;
                pemenang.forEach(p => { if (statistikPemain[p]) { statistikPemain[p].main++; statistikPemain[p].menang++; } });
                kalah.forEach(p => { if (statistikPemain[p]) { statistikPemain[p].main++; statistikPemain[p].kalah++; } });
            });
        });
    }
    const pemainYangBermain = Object.entries(statistikPemain).filter(([nama, stats]) => stats.main > 0);
    if (pemainYangBermain.length === 0) { containerKlasemenUmum.innerHTML = `<p>No matches have been completed yet.</p>`; return; }
    const urutanPemain = pemainYangBermain.sort((a, b) => {
        const poinB = b[1].menang * 10, poinA = a[1].menang * 10;
        return poinB - poinA;
    });
    let htmlTabel = `<table><tr><th>Player</th><th>Pld</th><th>W</th><th>L</th><th>Win %</th><th>Pts</th></tr>`;
    urutanPemain.forEach(([nama, stats]) => {
        const persentaseMenang = (stats.menang / stats.main) * 100;
        const poin = stats.menang * 10;
        htmlTabel += `<tr><td>${nama}</td><td>${stats.main}</td><td>${stats.menang}</td><td>${stats.kalah}</td><td>${persentaseMenang.toFixed(0)}%</td><td>${poin}</td></tr>`;
    });
    htmlTabel += `</table>`;
    containerKlasemenUmum.innerHTML = htmlTabel;
}