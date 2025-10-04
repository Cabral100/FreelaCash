// FreelaCash Frontend Application

// State Management
const state = {
    user: null,
    token: null,
    currentPage: 'home',
    currentFilter: 'all'
};

// API Base URL
const API_URL = '/api';

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Check for saved token
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
        state.token = savedToken;
        state.user = JSON.parse(savedUser);
        updateAuthUI();
        loadUserData();
    }
    
    // Load initial page content
    if (state.user) {
        showPage('dashboard');
    } else {
        showPage('home');
    }
});

// Page Navigation
function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    const page = document.getElementById(pageName + 'Page');
    if (page) {
        page.classList.add('active');
        state.currentPage = pageName;
        
        // Load page data
        loadPageData(pageName);
    }
}

function loadPageData(pageName) {
    switch(pageName) {
        case 'projects':
            loadProjects('all');
            break;
        case 'freelancers':
            loadFreelancers();
            break;
        case 'dashboard':
            if (state.user) {
                loadDashboard();
            }
            break;
    }
}

// Authentication
async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: formData.get('email'),
                password: formData.get('password')
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            state.token = data.access_token;
            state.user = data.user;
            
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            updateAuthUI();
            showPage('dashboard');
            showNotification('Login realizado com sucesso!', 'success');
        } else {
            showNotification(data.error || 'Erro ao fazer login', 'error');
        }
    } catch (error) {
        showNotification('Erro ao conectar com o servidor', 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: formData.get('name'),
                email: formData.get('email'),
                password: formData.get('password'),
                phone: formData.get('phone'),
                user_type: formData.get('user_type')
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            state.token = data.access_token;
            state.user = data.user;
            
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            updateAuthUI();
            showPage('dashboard');
            showNotification('Cadastro realizado com sucesso!', 'success');
        } else {
            showNotification(data.error || 'Erro ao cadastrar', 'error');
        }
    } catch (error) {
        showNotification('Erro ao conectar com o servidor', 'error');
    }
}

function logout() {
    state.user = null;
    state.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateAuthUI();
    showPage('home');
    showNotification('Logout realizado com sucesso', 'success');
}

function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const createProjectBtn = document.getElementById('createProjectBtn');
    
    if (state.user) {
        authButtons.style.display = 'none';
        userMenu.style.display = 'flex';
        document.getElementById('userName').textContent = state.user.name;
        
        if (state.user.user_type === 'client' && createProjectBtn) {
            createProjectBtn.style.display = 'block';
        }
    } else {
        authButtons.style.display = 'flex';
        userMenu.style.display = 'none';
        if (createProjectBtn) {
            createProjectBtn.style.display = 'none';
        }
    }
}

async function loadUserData() {
    if (!state.token) return;
    
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            state.user = data.user;
            localStorage.setItem('user', JSON.stringify(data.user));
            
            if (data.wallet) {
                updateBalanceDisplay(data.wallet.balance);
            }
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

function updateBalanceDisplay(balance) {
    const balanceElements = document.querySelectorAll('#userBalance, #dashboardBalance');
    balanceElements.forEach(el => {
        el.textContent = formatCurrency(balance);
    });
}

// Projects
async function loadProjects(filter) {
    state.currentFilter = filter;
    
    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target?.classList.add('active');
    
    const projectsList = document.getElementById('projectsList');
    projectsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Carregando...</p>';
    
    try {
        let url = `${API_URL}/projects/`;
        const params = new URLSearchParams();
        
        if (filter === 'available') {
            params.append('user_type', 'available');
        } else if (filter === 'my_projects' && state.user) {
            params.append('user_type', 'my_projects');
        }
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        const headers = {};
        if (state.token) {
            headers['Authorization'] = `Bearer ${state.token}`;
        }
        
        const response = await fetch(url, { headers });
        
        if (response.ok) {
            const data = await response.json();
            displayProjects(data.projects);
        } else {
            projectsList.innerHTML = '<p style="text-align: center; color: var(--error);">Erro ao carregar projetos</p>';
        }
    } catch (error) {
        projectsList.innerHTML = '<p style="text-align: center; color: var(--error);">Erro ao conectar com o servidor</p>';
    }
}

function filterProjects(filter) {
    if (filter === 'my_projects' && !state.user) {
        showNotification('Faça login para ver seus projetos', 'warning');
        showPage('login');
        return;
    }
    
    loadProjects(filter);
}

function displayProjects(projects) {
    const projectsList = document.getElementById('projectsList');
    
    if (projects.length === 0) {
        projectsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Nenhum projeto encontrado</p>';
        return;
    }
    
    projectsList.innerHTML = projects.map(project => `
        <div class="project-card" onclick="showProjectDetails('${project.project_id}')">
            <div class="project-header">
                <div>
                    <h3 class="project-title">${project.title}</h3>
                    <span class="project-status status-${project.status}">${getStatusLabel(project.status)}</span>
                </div>
            </div>
            <p class="project-description">${project.description}</p>
            <div class="project-amount">${formatCurrency(project.amount)}</div>
            <div class="project-meta">
                <span>Cliente: ${project.client_name || 'N/A'}</span>
                ${project.freelancer_name ? `<span>Freelancer: ${project.freelancer_name}</span>` : ''}
            </div>
        </div>
    `).join('');
}

async function showProjectDetails(projectId) {
    if (!state.token) {
        showNotification('Faça login para ver detalhes do projeto', 'warning');
        showPage('login');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/projects/${projectId}`, {
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayProjectDetailsModal(data.project);
        }
    } catch (error) {
        showNotification('Erro ao carregar detalhes do projeto', 'error');
    }
}

function displayProjectDetailsModal(project) {
    const modal = document.getElementById('projectDetailsModal');
    const title = document.getElementById('projectTitle');
    const details = document.getElementById('projectDetails');
    
    title.textContent = project.title;
    
    let actionsHTML = '';
    
    // Actions based on user role and project status
    if (state.user) {
        if (state.user.user_type === 'freelancer' && project.status === 'open' && !project.freelancer_id) {
            actionsHTML = `<button class="btn-primary" onclick="assignProject('${project.project_id}')">Candidatar-se</button>`;
        } else if (state.user.user_id === project.client_id) {
            if (project.status === 'assigned') {
                actionsHTML = `<button class="btn-primary" onclick="fundProject('${project.project_id}')">Financiar Projeto</button>`;
            } else if (project.status === 'delivered' || project.status === 'funded' || project.status === 'in_progress') {
                actionsHTML = `
                    <button class="btn-primary" onclick="releasePayment('${project.project_id}')">Liberar Pagamento</button>
                    <button class="btn-secondary" onclick="refundProject('${project.project_id}')">Solicitar Reembolso</button>
                `;
            }
        } else if (state.user.user_id === project.freelancer_id) {
            if (project.status === 'funded' || project.status === 'in_progress') {
                actionsHTML = `<button class="btn-primary" onclick="updateProjectStatus('${project.project_id}', 'delivered')">Marcar como Entregue</button>`;
            }
        }
    }
    
    details.innerHTML = `
        <div class="project-details">
            <p><strong>Status:</strong> <span class="project-status status-${project.status}">${getStatusLabel(project.status)}</span></p>
            <p><strong>Descrição:</strong></p>
            <p>${project.description}</p>
            <p><strong>Valor:</strong> ${formatCurrency(project.amount)}</p>
            <p><strong>Cliente:</strong> ${project.client_name || 'N/A'}</p>
            ${project.freelancer_name ? `<p><strong>Freelancer:</strong> ${project.freelancer_name}</p>` : ''}
            ${project.deadline ? `<p><strong>Prazo:</strong> ${formatDate(project.deadline)}</p>` : ''}
            <div class="modal-actions">
                <button class="btn-secondary" onclick="closeModal()">Fechar</button>
                ${actionsHTML}
            </div>
        </div>
    `;
    
    showModal('projectDetailsModal');
}

async function assignProject(projectId) {
    try {
        const response = await fetch(`${API_URL}/projects/${projectId}/assign`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Projeto atribuído com sucesso!', 'success');
            closeModal();
            loadProjects(state.currentFilter);
        } else {
            showNotification(data.error || 'Erro ao atribuir projeto', 'error');
        }
    } catch (error) {
        showNotification('Erro ao conectar com o servidor', 'error');
    }
}

async function fundProject(projectId) {
    if (!confirm('Deseja financiar este projeto? O valor será retido em custódia até a conclusão.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/transactions/fund-project/${projectId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Projeto financiado com sucesso!', 'success');
            closeModal();
            loadProjects(state.currentFilter);
            loadUserData();
        } else {
            showNotification(data.error || 'Erro ao financiar projeto', 'error');
        }
    } catch (error) {
        showNotification('Erro ao conectar com o servidor', 'error');
    }
}

async function releasePayment(projectId) {
    if (!confirm('Deseja liberar o pagamento para o freelancer? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/transactions/release-payment/${projectId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Pagamento liberado com sucesso!', 'success');
            closeModal();
            loadProjects(state.currentFilter);
            loadUserData();
        } else {
            showNotification(data.error || 'Erro ao liberar pagamento', 'error');
        }
    } catch (error) {
        showNotification('Erro ao conectar com o servidor', 'error');
    }
}

async function refundProject(projectId) {
    if (!confirm('Deseja solicitar reembolso deste projeto? O valor será devolvido à sua carteira.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/transactions/refund/${projectId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Reembolso realizado com sucesso!', 'success');
            closeModal();
            loadProjects(state.currentFilter);
            loadUserData();
        } else {
            showNotification(data.error || 'Erro ao processar reembolso', 'error');
        }
    } catch (error) {
        showNotification('Erro ao conectar com o servidor', 'error');
    }
}

async function updateProjectStatus(projectId, status) {
    try {
        const response = await fetch(`${API_URL}/projects/${projectId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${state.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Status atualizado com sucesso!', 'success');
            closeModal();
            loadProjects(state.currentFilter);
        } else {
            showNotification(data.error || 'Erro ao atualizar status', 'error');
        }
    } catch (error) {
        showNotification('Erro ao conectar com o servidor', 'error');
    }
}

async function handleCreateProject(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    try {
        const response = await fetch(`${API_URL}/projects/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: formData.get('title'),
                description: formData.get('description'),
                amount: parseFloat(formData.get('amount')),
                deadline: formData.get('deadline') || null
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Projeto criado com sucesso!', 'success');
            closeModal();
            form.reset();
            loadProjects(state.currentFilter);
        } else {
            showNotification(data.error || 'Erro ao criar projeto', 'error');
        }
    } catch (error) {
        showNotification('Erro ao conectar com o servidor', 'error');
    }
}

// Freelancers
async function loadFreelancers() {
    const freelancersList = document.getElementById('freelancersList');
    freelancersList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Carregando...</p>';
    
    try {
        const response = await fetch(`${API_URL}/users/freelancers`);
        
        if (response.ok) {
            const data = await response.json();
            displayFreelancers(data.freelancers);
        } else {
            freelancersList.innerHTML = '<p style="text-align: center; color: var(--error);">Erro ao carregar freelancers</p>';
        }
    } catch (error) {
        freelancersList.innerHTML = '<p style="text-align: center; color: var(--error);">Erro ao conectar com o servidor</p>';
    }
}

function displayFreelancers(freelancers) {
    const freelancersList = document.getElementById('freelancersList');
    
    if (freelancers.length === 0) {
        freelancersList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Nenhum freelancer encontrado</p>';
        return;
    }
    
    freelancersList.innerHTML = freelancers.map(freelancer => `
        <div class="freelancer-card">
            <h3 class="freelancer-name">${freelancer.name}</h3>
            <div class="freelancer-rating">⭐ ${freelancer.average_rating.toFixed(1)}</div>
            <p style="color: var(--text-secondary);">${freelancer.email}</p>
            <div class="freelancer-stats">
                <div class="stat">
                    <div class="stat-value">${freelancer.total_projects}</div>
                    <div class="stat-label">Projetos</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${freelancer.total_reviews}</div>
                    <div class="stat-label">Avaliações</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${freelancer.reputation_score.toFixed(1)}</div>
                    <div class="stat-label">Reputação</div>
                </div>
            </div>
        </div>
    `).join('');
}

// Dashboard
async function loadDashboard() {
    if (!state.token) return;
    
    try {
        // Load wallet
        const walletResponse = await fetch(`${API_URL}/wallets/me`, {
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });
        
        if (walletResponse.ok) {
            const walletData = await walletResponse.json();
            updateBalanceDisplay(walletData.wallet.balance);
            displayTransactions(walletData.recent_transactions);
        }
        
        // Load user stats
        const userResponse = await fetch(`${API_URL}/users/${state.user.user_id}`);
        
        if (userResponse.ok) {
            const userData = await userResponse.json();
            displayUserStats(userData.statistics);
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function displayUserStats(stats) {
    const statsDiv = document.getElementById('userStats');
    
    statsDiv.innerHTML = `
        <div class="stat">
            <div class="stat-value">${stats.total_projects}</div>
            <div class="stat-label">Projetos</div>
        </div>
        <div class="stat">
            <div class="stat-value">${stats.average_rating.toFixed(1)}</div>
            <div class="stat-label">Avaliação Média</div>
        </div>
        <div class="stat">
            <div class="stat-value">${stats.total_reviews}</div>
            <div class="stat-label">Avaliações</div>
        </div>
    `;
}

function displayTransactions(transactions) {
    const transactionsDiv = document.getElementById('recentTransactions');
    
    if (transactions.length === 0) {
        transactionsDiv.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Nenhuma transação recente</p>';
        return;
    }
    
    transactionsDiv.innerHTML = transactions.map(transaction => {
        const isPositive = transaction.destination_wallet_id && transaction.destination_wallet_id === state.user.wallet?.wallet_id;
        
        return `
            <div class="transaction-item">
                <div>
                    <div>${getTransactionTypeLabel(transaction.transaction_type)}</div>
                    <div class="transaction-type">${formatDate(transaction.created_at)}</div>
                </div>
                <div class="transaction-amount ${isPositive ? 'positive' : 'negative'}">
                    ${isPositive ? '+' : '-'}${formatCurrency(transaction.amount)}
                </div>
            </div>
        `;
    }).join('');
}

// Wallet Operations
async function handleDeposit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    try {
        const response = await fetch(`${API_URL}/wallets/deposit`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: parseFloat(formData.get('amount')),
                description: formData.get('description')
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Depósito realizado com sucesso!', 'success');
            closeModal();
            form.reset();
            loadUserData();
            loadDashboard();
        } else {
            showNotification(data.error || 'Erro ao realizar depósito', 'error');
        }
    } catch (error) {
        showNotification('Erro ao conectar com o servidor', 'error');
    }
}

async function handleWithdraw(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    try {
        const response = await fetch(`${API_URL}/wallets/withdraw`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: parseFloat(formData.get('amount')),
                description: formData.get('description')
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Saque realizado com sucesso!', 'success');
            closeModal();
            form.reset();
            loadUserData();
            loadDashboard();
        } else {
            showNotification(data.error || 'Erro ao realizar saque', 'error');
        }
    } catch (error) {
        showNotification('Erro ao conectar com o servidor', 'error');
    }
}

// Modal Management
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modalOverlay');
    
    if (modal) {
        modal.classList.add('active');
        overlay.classList.add('active');
    }
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    document.getElementById('modalOverlay').classList.remove('active');
}

function showCreateProjectModal() {
    showModal('createProjectModal');
}

function showDepositModal() {
    showModal('depositModal');
}

function showWithdrawModal() {
    showModal('withdrawModal');
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
}

function getStatusLabel(status) {
    const labels = {
        'open': 'Aberto',
        'assigned': 'Atribuído',
        'funded': 'Financiado',
        'in_progress': 'Em Andamento',
        'delivered': 'Entregue',
        'completed': 'Concluído',
        'disputed': 'Em Disputa',
        'cancelled': 'Cancelado'
    };
    return labels[status] || status;
}

function getTransactionTypeLabel(type) {
    const labels = {
        'deposit': 'Depósito',
        'payment': 'Pagamento',
        'release': 'Liberação',
        'withdrawal': 'Saque',
        'refund': 'Reembolso'
    };
    return labels[type] || type;
}

function showNotification(message, type = 'info') {
    // Simple alert for now - can be enhanced with a toast notification system
    alert(message);
}
