document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================
       1. Application State & Storage
       ========================================== */
    let leads = JSON.parse(localStorage.getItem('void_crm_leads')) || [];
    let isEditing = false;
    
    // Chart instances
    let dashChartInst = null;
    let distChartInst = null;
    let trendChartInst = null;

    // Chart global defaults for dark theme
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Outfit', sans-serif";

    function saveState() {
        localStorage.setItem('void_crm_leads', JSON.stringify(leads));
        updateDashboard(); // Every state change refreshes charts/metrics
        updateAnalytics(); 
    }

    // Default mock data if empty (just for visual presentation initially)
    if(leads.length === 0) {
        const now = Date.now();
        leads = [
            { id: '111', name: 'Alice Morgan', email: 'alice@morgancorp.com', phone: '555-0101', status: 'Converted', notes: '', date: now - 86400000*2 },
            { id: '222', name: 'David Wallace', email: 'david@dunder.com', phone: '555-0102', status: 'New', notes: 'Call him ASAP', date: now - 86400000 },
            { id: '333', name: 'Emma Stone', email: 'emma@stone.com', phone: '555-0103', status: 'Interested', notes: '', date: now - 86400000*3 },
            { id: '444', name: 'Chris Evans', email: 'chris@evans.com', phone: '555-0104', status: 'Contacted', notes: '', date: now - 86400000*4 },
        ];
        saveState();
    }


    /* ==========================================
       2. Navigation View Switching
       ========================================== */
    const navItems = document.querySelectorAll('.nav-menu .nav-item');
    const viewPanels = document.querySelectorAll('.view-panel');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');
            if(!targetId) return;

            // Manage Classes
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            viewPanels.forEach(p => p.classList.add('hidden'));
            document.getElementById(targetId).classList.remove('hidden');

            // Hook for chart rendering correctly if they resize
            if(targetId === 'view-dashboard') updateDashboard();
            if(targetId === 'view-analytics') updateAnalytics();
        });
    });


    /* ==========================================
       3. Leads Management Logic
       ========================================== */
    const leadForm = document.getElementById('lead-form');
    const tblBody = document.getElementById('leads-table-body');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-input');
    const filterStatus = document.getElementById('filter-status');

    renderLeads();

    leadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const id = document.getElementById('lead-id').value;
        const name = document.getElementById('lead-name').value.trim();
        const email = document.getElementById('lead-email').value.trim();
        const phone = document.getElementById('lead-phone').value.trim();
        const status = document.getElementById('lead-status').value;

        if (isEditing && id) {
            const ix = leads.findIndex(l => l.id === id);
            if(ix !== -1) {
                leads[ix].name = name;
                leads[ix].email = email;
                leads[ix].phone = phone;
                leads[ix].status = status;
            }
        } else {
            leads.unshift({
                id: Date.now().toString(36),
                name, email, phone, status,
                notes: '',
                date: Date.now()
            });
        }

        saveState();
        resetLeadForm();
        renderLeads();
    });

    document.getElementById('cancel-edit-btn').addEventListener('click', (e) => {
        e.preventDefault();
        resetLeadForm();
    });

    searchInput.addEventListener('input', renderLeads);
    filterStatus.addEventListener('change', renderLeads);


    function renderLeads() {
        const query = searchInput.value.toLowerCase();
        const filt = filterStatus.value;

        const results = leads.filter(l => {
            const mS = l.name.toLowerCase().includes(query) || l.email.toLowerCase().includes(query);
            const mF = filt === 'All' ? true : l.status === filt;
            return mS && mF;
        });

        tblBody.innerHTML = '';
        if(results.length === 0) {
            emptyState.classList.remove('hidden');
            document.querySelector('#view-leads table').classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            document.querySelector('#view-leads table').classList.remove('hidden');

            results.forEach(lead => {
                const tr = document.createElement('tr');
                const d = new Date(lead.date).toLocaleDateString([], {month:'short', day:'numeric', year:'numeric'});
                
                tr.innerHTML = `
                    <td>
                        <div class="lead-p">
                            <strong>${lead.name}</strong>
                            <span><i class='bx bx-envelope'></i> ${lead.email} &bull; <i class='bx bx-phone'></i> ${lead.phone}</span>
                        </div>
                    </td>
                    <td style="color:var(--text-muted); font-size:0.85rem;">
                        ${d}
                    </td>
                    <td>
                        <select class="status-dd s-${lead.status.toLowerCase()}" onchange="changeLeadStatus('${lead.id}', this.value)">
                            <option value="New" ${lead.status === 'New' ? 'selected':''}>New</option>
                            <option value="Contacted" ${lead.status === 'Contacted' ? 'selected':''}>Contacted</option>
                            <option value="Interested" ${lead.status === 'Interested' ? 'selected':''}>Interested</option>
                            <option value="Converted" ${lead.status === 'Converted' ? 'selected':''}>Converted</option>
                        </select>
                    </td>
                    <td>
                        <div class="action-group">
                            <button class="notes-btn" onclick="addNotes('${lead.id}')" title="${lead.notes ? 'View/Edit Notes' : 'Add Notes'}">
                                <i class='bx ${lead.notes ? 'bx-message-check' : 'bx-message-square-add'}'></i> Notes
                            </button>
                            <button class="btn-icon" onclick="editLead('${lead.id}')"><i class='bx bx-edit-alt'></i></button>
                            <button class="btn-icon danger" onclick="deleteLead('${lead.id}')"><i class='bx bx-trash'></i></button>
                        </div>
                    </td>
                `;
                tblBody.appendChild(tr);
            });
        }
    }

    function resetLeadForm() {
        leadForm.reset();
        document.getElementById('lead-id').value = '';
        isEditing = false;
        document.getElementById('form-title').textContent = 'Add New Lead';
        document.getElementById('submit-btn').textContent = 'Save Lead';
        document.getElementById('cancel-edit-btn').classList.add('hidden');
    }

    window.editLead = (id) => {
        const lead = leads.find(l => l.id === id);
        if(!lead) return;
        document.getElementById('lead-id').value = lead.id;
        document.getElementById('lead-name').value = lead.name;
        document.getElementById('lead-email').value = lead.email;
        document.getElementById('lead-phone').value = lead.phone;
        document.getElementById('lead-status').value = lead.status;
        
        isEditing = true;
        document.getElementById('form-title').textContent = 'Edit Lead Details';
        document.getElementById('submit-btn').textContent = 'Update Lead';
        document.getElementById('cancel-edit-btn').classList.remove('hidden');
    };

    window.deleteLead = (id) => {
        if(confirm('Are you sure you want to permanently delete this lead?')) {
            leads = leads.filter(l => l.id !== id);
            saveState();
            renderLeads();
            if(isEditing && document.getElementById('lead-id').value === id) { resetLeadForm(); }
        }
    };

    window.changeLeadStatus = (id, newStatus) => {
        const i = leads.findIndex(l => l.id === id);
        if(i !== -1) {
            leads[i].status = newStatus;
            saveState();
            renderLeads();
        }
    };

    window.addNotes = (id) => {
        const i = leads.findIndex(l => l.id === id);
        if(i !== -1) {
            const currentNote = leads[i].notes || '';
            const promptNote = prompt(`Notes for ${leads[i].name}:`, currentNote);
            if(promptNote !== null) {
                leads[i].notes = promptNote;
                saveState();
                renderLeads();
            }
        }
    };

    /* ==========================================
       4. Dashboard Logic
       ========================================== */
    updateDashboard();

    function updateDashboard() {
        const total = leads.length;
        const _new = leads.filter(l => l.status === 'New').length;
        const conv = leads.filter(l => l.status === 'Converted').length;
        const rate = total > 0 ? ((conv / total) * 100).toFixed(1) : 0;

        document.getElementById('dash-total').textContent = total;
        document.getElementById('dash-new').textContent = _new;
        document.getElementById('dash-converted').textContent = conv;
        document.getElementById('dash-rate').textContent = rate + '%';

        renderDashChart();
        renderRecentActivity();
    }

    function renderRecentActivity() {
        const ul = document.getElementById('recent-activity-list');
        ul.innerHTML = '';
        const recent = [...leads].sort((a,b) => b.date - a.date).slice(0, 5);
        if(recent.length === 0) {
            ul.innerHTML = '<li style="color:var(--text-muted);">No activity recorded.</li>';
            return;
        }

        recent.forEach(act => {
            const dateStr = new Date(act.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="act-icon"><i class='bx bx-user'></i></div>
                <div class="act-info">
                    <p>Added <strong>${act.name}</strong> as <em>${act.status}</em></p>
                    <small>${dateStr}</small>
                </div>
            `;
            ul.appendChild(li);
        });
    }

    function renderDashChart() {
        const stats = { New: 0, Contacted: 0, Interested: 0, Converted: 0 };
        leads.forEach(l => { if(stats[l.status] !== undefined) stats[l.status]++; });

        const ctx = document.getElementById('leadChart').getContext('2d');
        if(dashChartInst) dashChartInst.destroy();

        dashChartInst = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['New', 'Contacted', 'Interested', 'Converted'],
                datasets: [{
                    label: 'Count',
                    data: [stats.New, stats.Contacted, stats.Interested, stats.Converted],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.7)',
                        'rgba(245, 158, 11, 0.7)',
                        'rgba(139, 92, 246, 0.7)',
                        'rgba(16, 185, 129, 0.7)'
                    ],
                    borderColor: ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981'],
                    borderWidth: 1, borderRadius: 6, barPercentage: 0.6
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false } },
                    x: { grid: { display: false, drawBorder: false } }
                }
            }
        });
    }

    /* ==========================================
       5. Advanced Analytics Logic
       ========================================== */
    function updateAnalytics() {
        renderDistChart();
        renderTrendChart();
    }

    function renderDistChart() {
        const stats = { New: 0, Contacted: 0, Interested: 0, Converted: 0 };
        leads.forEach(l => { if(stats[l.status] !== undefined) stats[l.status]++; });

        const ctx = document.getElementById('statusChart').getContext('2d');
        if(distChartInst) distChartInst.destroy();

        distChartInst = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['New', 'Contacted', 'Interested', 'Converted'],
                datasets: [{
                    data: [stats.New, stats.Contacted, stats.Interested, stats.Converted],
                    backgroundColor: ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { padding: 20 } }
                },
                cutout: '70%'
            }
        });
    }

    function renderTrendChart() {
        // Group leads by date (last 7 days logic simulated)
        // For accurate demonstration, we will map actual dates to counts if we have enough data.
        // For now, let's map lead counts by specific days formatted.
        
        let rawCounts = {};
        leads.forEach(l => {
            const dStr = new Date(l.date).toLocaleDateString([], { month: 'short', day: 'numeric' });
            rawCounts[dStr] = (rawCounts[dStr] || 0) + 1;
        });

        // Convert dict to sorted array assuming sequential. Real app would interpolate missing days.
        let labels = Object.keys(rawCounts).reverse();
        let dataPoints = Object.values(rawCounts).reverse();

        const ctx = document.getElementById('trendChart').getContext('2d');
        if(trendChartInst) trendChartInst.destroy();

        trendChartInst = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Leads Acquired',
                    data: dataPoints,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4, // smooth curve
                    pointBackgroundColor: '#8b5cf6',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false } },
                    x: { grid: { display: false, drawBorder: false } }
                }
            }
        });
    }
});
