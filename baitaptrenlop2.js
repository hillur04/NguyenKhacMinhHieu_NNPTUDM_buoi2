// Script: fetch products, realtime search (onChanged), dropdown sort and pagination (5 per page)
let products = [];
let filtered = [];
let currentPage = 1;
let itemsPerPage = 5; // dynamic; can change via select
let currentSort = { by: null, order: 'asc' };
const originalIndex = new Map();

const tableBody = document.getElementById('table-body');
const paginationEl = document.getElementById('pagination');
const totalCountEl = document.getElementById('total-count');
const perPageSelect = document.getElementById('perPageSelect');
const editModal = document.getElementById('editModal');
const modalTitle = document.getElementById('modalTitle');
const modalPrice = document.getElementById('modalPrice');
const modalDescription = document.getElementById('modalDescription');
const modalImage = document.getElementById('modalImage');
let lastQuery = '';
let editingId = null;

function rebuildOriginalIndex(){
    originalIndex.clear();
    products.forEach((p, idx) => originalIndex.set(p.id, idx));
}

function fetchProducts(){
    fetch('db.json')
        .then(r => r.json())
        .then(data => {
            products = Array.isArray(data) ? data : [];
            rebuildOriginalIndex();
            filtered = products.slice();
            updateTotal();
            applySort();
            // init per page select if present
            if(perPageSelect) perPageSelect.value = String(itemsPerPage);
            renderTable();
            renderPagination();
        })
        .catch(err => {
            console.error('Lỗi:', err);
            tableBody.innerHTML = '<tr><td colspan="7">Không thể tải dữ liệu.</td></tr>';
        });
}

// Called on input (realtime). The function name matches the requirement 'onChanged'.
function onChanged(event){
    const q = (event.target.value || '').trim().toLowerCase();
    lastQuery = q;
    applyCurrentSearch();
    currentPage = 1;
    updateTotal();
    applySort();
    renderTable();
    renderPagination();
}

function applyCurrentSearch(){
    const q = lastQuery;
    if(!q){
        filtered = products.slice();
    } else {
        filtered = products.filter(p => (p.title || '').toLowerCase().includes(q));
    }
}

function onFilterChanged(event){
    const val = event.target.value;
    if(val === 'default'){
        currentSort.by = null;
        currentSort.order = 'asc';
    } else if(val === 'title-asc'){
        currentSort.by = 'title'; currentSort.order = 'asc';
    } else if(val === 'title-desc'){
        currentSort.by = 'title'; currentSort.order = 'desc';
    } else if(val === 'price-desc'){
        currentSort.by = 'price'; currentSort.order = 'desc';
    } else if(val === 'price-asc'){
        currentSort.by = 'price'; currentSort.order = 'asc';
    }
    currentPage = 1;
    applySort();
    renderTable();
    renderPagination();
}

function onPerPageChanged(event){
    const val = Number(event.target.value) || 5;
    itemsPerPage = val;
    currentPage = 1;
    renderTable();
    renderPagination();
}

function updateTotal(){
    totalCountEl.textContent = filtered.length;
}

function applySort(){
    // default: restore original order
    if(!currentSort.by){
        filtered.sort((a,b) => (originalIndex.get(a.id) || 0) - (originalIndex.get(b.id) || 0));
        return;
    }
    const {by, order} = currentSort;
    filtered.sort((a,b) => {
        if(by === 'title'){
            const A = (a.title || '').toLowerCase();
            const B = (b.title || '').toLowerCase();
            if(A < B) return order === 'asc' ? -1 : 1;
            if(A > B) return order === 'asc' ? 1 : -1;
            return 0;
        }
        if(by === 'price'){
            const A = Number(a.price) || 0;
            const B = Number(b.price) || 0;
            return order === 'asc' ? A - B : B - A;
        }
        return 0;
    });
}

function renderTable(){
    tableBody.innerHTML = '';
    const start = (currentPage - 1) * itemsPerPage;
    const pageItems = filtered.slice(start, start + itemsPerPage);

    if(pageItems.length === 0){
        tableBody.innerHTML = '<tr><td colspan="7" style="color:var(--muted)">Không có sản phẩm phù hợp.</td></tr>';
        return;
    }

    pageItems.forEach((product, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${product.id}</td>
            <td>
                <div class="title">${escapeHtml(product.title || '—')}</div>
                <div class="category">${escapeHtml(product.brand || '')}</div>
            </td>
            <td>${escapeHtml(product.slug || 'N/A')}</td>
            <td class="price">${formatCurrency(product.price)}</td>
            <td>${escapeHtml((product.category && product.category.name) || '')}</td>
            <td class="img-wrap"><img loading="lazy" src="${(product.images && product.images[0]) || 'https://via.placeholder.com/80?text=No+Image'}" alt="product image" onerror="this.onerror=null;this.src='https://via.placeholder.com/80?text=No+Image'"></td>
            <td>
                <div style="display:flex;gap:8px">
                    <button class="btn btn-sm btn-outline-primary" onclick="editProduct(${product.id})">Sửa</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct(${product.id})">Xóa</button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function renderPagination(){
    paginationEl.innerHTML = '';
    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    // prev button
    const prev = document.createElement('button');
    prev.className = 'page-btn';
    prev.textContent = '<';
    prev.disabled = currentPage === 1;
    prev.onclick = () => { if(currentPage>1){ currentPage--; renderTable(); renderPagination(); window.scrollTo({top:0,behavior:'smooth'});} };
    paginationEl.appendChild(prev);

    // numbered buttons
    for(let i=1;i<=totalPages;i++){
        const btn = document.createElement('button');
        btn.className = 'page-btn' + (i===currentPage? ' active':'');
        btn.textContent = i;
        btn.onclick = (() => { const page = i; return () => { currentPage = page; renderTable(); renderPagination(); window.scrollTo({top:0,behavior:'smooth'}); }; })();
        paginationEl.appendChild(btn);
    }

    // next button
    const next = document.createElement('button');
    next.className = 'page-btn';
    next.textContent = '>';
    next.disabled = currentPage === totalPages;
    next.onclick = () => { if(currentPage<totalPages){ currentPage++; renderTable(); renderPagination(); window.scrollTo({top:0,behavior:'smooth'});} };
    paginationEl.appendChild(next);
}

// actions: delete and edit
function deleteProduct(id){
    if(!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    const idx = products.findIndex(p => p.id === id);
    if(idx === -1) return alert('Không tìm thấy sản phẩm.');
    products.splice(idx,1);
    rebuildOriginalIndex();
    applyCurrentSearch();
    updateTotal();
    applySort();
    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    if(currentPage > totalPages) currentPage = totalPages;
    renderTable();
    renderPagination();
}

function editProduct(id){
    const p = products.find(x => x.id === id);
    if(!p) return alert('Không tìm thấy sản phẩm.');
    editingId = id;
    modalTitle.value = p.title || '';
    modalPrice.value = p.price || '';
    modalDescription.value = p.description || '';
    modalImage.value = (p.images && p.images[0]) || '';
    editModal.classList.add('active');
}

function closeModal(){
    editingId = null;
    editModal.classList.remove('active');
}

function saveEdit(){
    if(editingId === null) return;
    const p = products.find(x => x.id === editingId);
    if(!p) return alert('Không tìm thấy sản phẩm.');
    p.title = modalTitle.value.trim() || p.title;
    p.price = Number(modalPrice.value) || p.price;
    p.description = modalDescription.value.trim() || p.description;
    const imgUrl = modalImage.value.trim();
    if(imgUrl) p.images = [imgUrl];
    rebuildOriginalIndex();
    applyCurrentSearch();
    applySort();
    updateTotal();
    renderTable();
    renderPagination();
    closeModal();
}

// Small helpers
function formatCurrency(v){
    const n = Number(v);
    if(isNaN(n)) return '-';
    return n.toLocaleString('en-US', {style:'currency', currency:'USD'});
}

function truncate(str, max){
    return str.length > max ? str.slice(0,max-1) + '…' : str;
}

function escapeHtml(str){
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// close modal on ESC or outside click
document.addEventListener('keydown', (e) => { if(e.key === 'Escape') closeModal(); });
if(editModal) editModal.addEventListener('click', (e) => { if(e.target === editModal) closeModal(); });

// init
fetchProducts();
