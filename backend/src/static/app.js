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

    // Always load initial page as home
    showPage('home');
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
    let clientInfoHTML = '';
    let deliverablesHTML = '';

    if (state.user) {
        if (state.user.user_type === 'freelancer' && project.status === 'open' && !project.freelancer_id) {
            actionsHTML = `<button class="btn-primary" onclick="showApplyModal('${project.project_id}')">Candidatar-se</button>`;
            clientInfoHTML = `<p><strong>Cliente:</strong> <span class="client-profile-link" onclick="showClientDetails('${project.client_id}')">${project.client_name || 'N/A'}</span></p>`;
        } else if (state.user.user_type === 'freelancer' && state.user.user_id === project.freelancer_id) {
            clientInfoHTML = `<p><strong>Cliente:</strong> <span class="client-profile-link" onclick="showClientDetails('${project.client_id}')">${project.client_name || 'N/A'}</span></p>`;

            if (project.status === 'funded' || project.status === 'in_progress') {
                actionsHTML = `<button class="btn-primary" onclick="showDeliveryModal('${project.project_id}')">Marcar como Entregue</button>`;
            } else if (project.status === 'completed') {
                actionsHTML = `<button class="btn-primary" onclick="showClientReviewModal('${project.project_id}')">Avaliar Cliente</button>`;
            }
        } else if (state.user.user_id === project.client_id) {
            clientInfoHTML = `<p><strong>Cliente:</strong> ${project.client_name || 'N/A'}</p>`;

            if (project.status === 'open') {
                actionsHTML = `<button class="btn-primary" onclick="viewApplications('${project.project_id}')">Ver Candidaturas</button>`;
            } else if (project.status === 'assigned') {
                actionsHTML = `<button class="btn-primary" onclick="fundProject('${project.project_id}')">Financiar Projeto</button>`;
            } else if (project.status === 'delivered') {
                if (project.deliverables && project.deliverables.length > 0) {
                    deliverablesHTML = `
                        <div class="deliverables-section">
                            <h4>Arquivos Entregues:</h4>
                            ${project.deliverables.map(file => `
                                <div class="deliverable-item">
                                    <div class="file-info">
                                        <span>📎</span>
                                        <a href="${file.url}" target="_blank" class="deliverable-link">${file.filename}</a>
                                        <span style="color: var(--text-secondary); font-size: 0.9rem;">(${file.size || 'N/A'})</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                }
                actionsHTML = `
                    <button class="btn-primary" onclick="releasePayment('${project.project_id}')">Liberar Pagamento</button>
                    <button class="btn-secondary" onclick="refundProject('${project.project_id}')">Solicitar Reembolso</button>
                `;
            } else if (project.status === 'funded' || project.status === 'in_progress') {
                actionsHTML = `
                    <button class="btn-primary" onclick="releasePayment('${project.project_id}')">Liberar Pagamento</button>
                    <button class="btn-secondary" onclick="refundProject('${project.project_id}')">Solicitar Reembolso</button>
                `;
            } else if (project.status === 'awaiting_review') {
                actionsHTML = `<button class="btn-primary" onclick="showReviewModal('${project.project_id}')">Avaliar Freelancer</button>`;
            }
        }
    } else {
        clientInfoHTML = `<p><strong>Cliente:</strong> ${project.client_name || 'N/A'}</p>`;
    }

    details.innerHTML = `
        <div class="project-details">
            <p><strong>Status:</strong> <span class="project-status status-${project.status}">${getStatusLabel(project.status)}</span></p>
            <p><strong>Descrição:</strong></p>
            <p>${project.description}</p>
            <p><strong>Valor:</strong> ${formatCurrency(project.amount)}</p>
            ${clientInfoHTML}
            ${project.freelancer_name ? `<p><strong>Freelancer:</strong> ${project.freelancer_name}</p>` : ''}
            ${project.deadline ? `<p><strong>Prazo:</strong> ${formatDate(project.deadline)}</p>` : ''}
            ${deliverablesHTML}
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
    if (!confirm('Deseja liberar o pagamento para o freelancer? Após isso, você será obrigado a avaliar o freelancer.')) {
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
            if (data.requires_review) {
                closeModal();
                showNotification(data.message || 'Pagamento liberado! Por favor, avalie o freelancer.', 'success');
                setTimeout(() => {
                    showReviewModal(projectId);
                }, 1000);
            } else {
                showNotification('Pagamento liberado com sucesso!', 'success');
                closeModal();
            }
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
        <div class="freelancer-card" onclick="showFreelancerDetails('${freelancer.user_id}')" style="cursor: pointer;">
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

async function showFreelancerDetails(freelancerId) {
    try {
        const response = await fetch(`${API_URL}/users/${freelancerId}`);

        if (response.ok) {
            const data = await response.json();
            displayFreelancerDetailsModal(data);
        } else {
            showNotification('Erro ao carregar detalhes do freelancer', 'error');
        }
    } catch (error) {
        showNotification('Erro ao conectar com o servidor', 'error');
    }
}

function displayFreelancerDetailsModal(data) {
    const modal = document.getElementById('freelancerDetailsModal');
    const details = document.getElementById('freelancerDetails');

    const user = data.user;
    const stats = data.statistics;
    const reviews = data.recent_reviews || [];
    const projects = data.completed_projects || [];

    let reviewsHTML = reviews.length > 0
        ? reviews.map(review => `
            <div style="padding: 15px; background: var(--card-bg); border-radius: 8px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <strong>${review.reviewer_name || 'Cliente'}</strong>
                    <span>⭐ ${review.rating.toFixed(1)}</span>
                </div>
                <p style="color: var(--text-secondary); font-size: 0.9em; margin-bottom: 8px;">${review.project_title || ''}</p>
                <p>${review.comment || 'Sem comentários'}</p>
                <p style="color: var(--text-secondary); font-size: 0.8em; margin-top: 8px;">${formatDate(review.created_at)}</p>
            </div>
        `).join('')
        : '<p style="color: var(--text-secondary);">Nenhuma avaliação ainda</p>';

    details.innerHTML = `
        <div style="margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
                <div>
                    <h2 style="margin: 0 0 10px 0;">${user.name}</h2>
                    <p style="color: var(--text-secondary); margin: 0;">${user.email}</p>
                    ${user.bio ? `<p style="margin-top: 15px; line-height: 1.6;">${user.bio}</p>` : ''}
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 2em;">⭐ ${stats.average_rating.toFixed(1)}</div>
                    <div style="color: var(--text-secondary);">${stats.total_reviews} avaliações</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px;">
                <div style="text-align: center; padding: 15px; background: var(--card-bg); border-radius: 8px;">
                    <div style="font-size: 2em; font-weight: bold; color: var(--primary-color);">${stats.total_projects}</div>
                    <div style="color: var(--text-secondary);">Projetos Completados</div>
                </div>
                <div style="text-align: center; padding: 15px; background: var(--card-bg); border-radius: 8px;">
                    <div style="font-size: 2em; font-weight: bold; color: var(--primary-color);">⭐${stats.average_rating.toFixed(1)}</div>
                    <div style="color: var(--text-secondary);">Avaliação Média</div>
                </div>
                <div style="text-align: center; padding: 15px; background: var(--card-bg); border-radius: 8px;">
                    <div style="font-size: 2em; font-weight: bold; color: var(--primary-color);">${user.reputation_score.toFixed(1)}</div>
                    <div style="color: var(--text-secondary);">Reputação</div>
                </div>
            </div>

            <h3 style="margin-bottom: 15px;">Avaliações Recentes</h3>
            <div style="max-height: 400px; overflow-y: auto;">
                ${reviewsHTML}
            </div>

            <div style="margin-top: 20px; text-align: center;">
                <button class="btn-secondary" onclick="closeModal()">Fechar</button>
            </div>
        </div>
    `;

    showModal('freelancerDetailsModal');
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
        'awaiting_review': 'Aguardando Avaliação',
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
    const overlay = document.createElement('div');
    overlay.className = 'notification-overlay';

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'notification-message';
    messageDiv.textContent = message;

    const button = document.createElement('button');
    button.className = 'btn-primary';
    button.textContent = 'OK';
    button.onclick = () => {
        overlay.remove();
        notification.remove();
    };

    notification.appendChild(messageDiv);
    notification.appendChild(button);

    document.body.appendChild(overlay);
    document.body.appendChild(notification);
}

function showApplyModal(projectId) {
    document.getElementById('applyProjectId').value = projectId;
    closeModal();
    showModal('applyProjectModal');
}

async function handleApplyToProject(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const projectId = formData.get('project_id');

    try {
        const response = await fetch(`${API_URL}/projects/${projectId}/apply`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                proposed_amount: parseFloat(formData.get('proposed_amount')),
                cover_letter: formData.get('cover_letter')
            })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Candidatura enviada com sucesso!', 'success');
            closeModal();
            form.reset();
            loadProjects(state.currentFilter);
        } else {
            showNotification(data.error || 'Erro ao enviar candidatura', 'error');
        }
    } catch (error) {
        showNotification('Erro ao conectar com o servidor', 'error');
    }
}

async function viewApplications(projectId) {
    try {
        const response = await fetch(`${API_URL}/projects/${projectId}/applications`, {
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            displayApplicationsModal(projectId, data.applications);
        } else {
            showNotification(data.error || 'Erro ao carregar candidaturas', 'error');
        }
    } catch (error) {
        showNotification('Erro ao conectar com o servidor', 'error');
    }
}

function displayApplicationsModal(projectId, applications) {
    const modal = document.getElementById('applicationsModal');
    const list = document.getElementById('applicationsList');

    if (applications.length === 0) {
        list.innerHTML = `
            <p style="text-align: center; color: var(--text-secondary); padding: 40px;">
                Nenhuma candidatura ainda
            </p>
            <div style="text-align: center;">
                <button class="btn-secondary" onclick="closeModal()">Fechar</button>
            </div>
        `;
    } else {
        list.innerHTML = `
            <div style="margin-bottom: 20px;">
                ${applications.map(app => `
                    <div style="padding: 20px; background: var(--card-bg); border-radius: 8px; margin-bottom: 15px; ${app.status === 'accepted' ? 'border: 2px solid var(--success);' : ''}">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                            <div>
                                <h4 style="margin: 0 0 5px 0;">${app.freelancer_name}</h4>
                                <div style="color: var(--text-secondary); font-size: 0.9em;">
                                    ⭐ ${app.freelancer_average_rating?.toFixed(1) || '0.0'}
                                    (${app.freelancer_total_reviews || 0} avaliações) •
                                    ${app.freelancer_total_projects || 0} projetos
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 1.5em; font-weight: bold; color: var(--primary-color);">
                                    ${formatCurrency(app.proposed_amount)}
                                </div>
                                <span class="project-status status-${app.status}">${app.status === 'pending' ? 'Pendente' : app.status === 'accepted' ? 'Aceito' : 'Rejeitado'}</span>
                            </div>
                        </div>
                        ${app.cover_letter ? `
                            <div style="margin-bottom: 15px;">
                                <strong>Carta de Apresentação:</strong>
                                <p style="margin-top: 8px; line-height: 1.6;">${app.cover_letter}</p>
                            </div>
                        ` : ''}
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="color: var(--text-secondary); font-size: 0.85em;">
                                Enviada em ${formatDate(app.created_at)}
                            </div>
                            ${app.status === 'pending' ? `
                                <div>
                                    <button class="btn-primary" onclick="acceptApplication('${projectId}', '${app.application_id}')" style="margin-right: 10px;">
                                        Aceitar
                                    </button>
                                    <button class="btn-secondary" onclick="showFreelancerDetails('${app.freelancer_id}')">
                                        Ver Perfil
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="text-align: center;">
                <button class="btn-secondary" onclick="closeModal()">Fechar</button>
            </div>
        `;
    }

    closeModal();
    showModal('applicationsModal');
}

async function acceptApplication(projectId, applicationId) {
    if (!confirm('Deseja aceitar esta candidatura? Os outros candidatos serão rejeitados.')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/projects/${projectId}/applications/${applicationId}/accept`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Candidatura aceita com sucesso!', 'success');
            closeModal();
            loadProjects(state.currentFilter);
        } else {
            showNotification(data.error || 'Erro ao aceitar candidatura', 'error');
        }
    } catch (error) {
        showNotification('Erro ao conectar com o servidor', 'error');
    }
}

function showReviewModal(projectId) {
    document.getElementById('reviewProjectId').value = projectId;
    closeModal();
    showModal('reviewModal');
}

async function handleCreateReview(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const projectId = formData.get('project_id');

    try {
        const response = await fetch(`${API_URL}/projects/${projectId}/review`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rating: parseFloat(formData.get('rating')),
                comment: formData.get('comment')
            })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Avaliação enviada com sucesso!', 'success');
            closeModal();
            form.reset();
            loadProjects(state.currentFilter);
        } else {
            showNotification(data.error || 'Erro ao enviar avaliação', 'error');
        }
    } catch (error) {
        showNotification('Erro ao conectar com o servidor', 'error');
    }
}

function showClientReviewModal(projectId) {
    document.getElementById('reviewClientProjectId').value = projectId;
    closeModal();
    showModal('reviewClientModal');
}

async function handleCreateClientReview(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const projectId = formData.get('project_id');

    try {
        const response = await fetch(`${API_URL}/projects/${projectId}/review-client`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rating: parseFloat(formData.get('rating')),
                comment: formData.get('comment')
            })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Avaliação do cliente enviada com sucesso!', 'success');
            closeModal();
            form.reset();
            loadProjects(state.currentFilter);
        } else {
            showNotification(data.error || 'Erro ao enviar avaliação', 'error');
        }
    } catch (error) {
        showNotification('Erro ao conectar com o servidor', 'error');
    }
}

let selectedFiles = [];

function initFileUpload() {
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileInput = document.getElementById('deliveryFiles');
    const uploadedFilesList = document.getElementById('uploadedFilesList');

    if (!fileUploadArea || !fileInput) return;

    fileUploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
    });

    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.classList.remove('dragover');
    });

    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
        handleFileSelection(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
        handleFileSelection(e.target.files);
    });
}

function handleFileSelection(files) {
    const uploadedFilesList = document.getElementById('uploadedFilesList');
    const maxSize = 10 * 1024 * 1024;

    Array.from(files).forEach(file => {
        if (file.size > maxSize) {
            showNotification(`Arquivo ${file.name} excede o tamanho máximo de 10MB`, 'error');
            return;
        }

        selectedFiles.push(file);

        const fileDiv = document.createElement('div');
        fileDiv.className = 'uploaded-file';
        fileDiv.innerHTML = `
            <div class="file-info">
                <span>📎</span>
                <span>${file.name}</span>
                <span style="color: var(--text-secondary); font-size: 0.9rem;">(${formatFileSize(file.size)})</span>
            </div>
            <button type="button" class="file-remove" onclick="removeFile(${selectedFiles.length - 1})">×</button>
        `;
        uploadedFilesList.appendChild(fileDiv);
    });
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    const uploadedFilesList = document.getElementById('uploadedFilesList');
    uploadedFilesList.innerHTML = '';
    selectedFiles.forEach((file, i) => {
        const fileDiv = document.createElement('div');
        fileDiv.className = 'uploaded-file';
        fileDiv.innerHTML = `
            <div class="file-info">
                <span>📎</span>
                <span>${file.name}</span>
                <span style="color: var(--text-secondary); font-size: 0.9rem;">(${formatFileSize(file.size)})</span>
            </div>
            <button type="button" class="file-remove" onclick="removeFile(${i})">×</button>
        `;
        uploadedFilesList.appendChild(fileDiv);
    });
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function showDeliveryModal(projectId) {
    document.getElementById('deliveryProjectId').value = projectId;
    selectedFiles = [];
    document.getElementById('uploadedFilesList').innerHTML = '';
    closeModal();
    showModal('deliveryModal');
    setTimeout(() => {
        initFileUpload();
    }, 100);
}

async function handleProjectDelivery(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const projectId = formData.get('project_id');

    const deliveryData = new FormData();
    deliveryData.append('description', formData.get('description'));
    selectedFiles.forEach((file, index) => {
        deliveryData.append(`files`, file);
    });

    try {
        const response = await fetch(`${API_URL}/projects/${projectId}/deliver`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`
            },
            body: deliveryData
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Projeto marcado como entregue! Aguarde a aprovação do cliente.', 'success');
            closeModal();
            form.reset();
            selectedFiles = [];
            loadProjects(state.currentFilter);
        } else {
            showNotification(data.error || 'Erro ao marcar projeto como entregue', 'error');
        }
    } catch (error) {
        showNotification('Erro ao conectar com o servidor', 'error');
    }
}

async function showClientDetails(clientId) {
    try {
        const response = await fetch(`${API_URL}/users/${clientId}`);

        if (response.ok) {
            const data = await response.json();
            displayClientDetailsModal(data);
        } else {
            showNotification('Erro ao carregar detalhes do cliente', 'error');
        }
    } catch (error) {
        showNotification('Erro ao conectar com o servidor', 'error');
    }
}

function displayClientDetailsModal(data) {
    const modal = document.getElementById('clientDetailsModal');
    const details = document.getElementById('clientDetails');

    const user = data.user;
    const stats = data.statistics;
    const reviews = data.recent_reviews || [];

    let reviewsHTML = reviews.length > 0
        ? reviews.map(review => `
            <div style="padding: 15px; background: var(--card-bg); border-radius: 8px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <strong>${review.reviewer_name || 'Freelancer'}</strong>
                    <span>⭐ ${review.rating.toFixed(1)}</span>
                </div>
                <p style="color: var(--text-secondary); font-size: 0.9em; margin-bottom: 8px;">${review.project_title || ''}</p>
                <p>${review.comment || 'Sem comentários'}</p>
                <p style="color: var(--text-secondary); font-size: 0.8em; margin-top: 8px;">${formatDate(review.created_at)}</p>
            </div>
        `).join('')
        : '<p style="color: var(--text-secondary);">Nenhuma avaliação ainda</p>';

    details.innerHTML = `
        <div style="margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
                <div>
                    <h2 style="margin: 0 0 10px 0;">${user.name}</h2>
                    <p style="color: var(--text-secondary); margin: 0;">${user.email}</p>
                    ${user.bio ? `<p style="margin-top: 15px; line-height: 1.6;">${user.bio}</p>` : ''}
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 2em;">⭐ ${stats.average_rating.toFixed(1)}</div>
                    <div style="color: var(--text-secondary);">${stats.total_reviews} avaliações</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px;">
                <div style="text-align: center; padding: 15px; background: var(--card-bg); border-radius: 8px;">
                    <div style="font-size: 2em; font-weight: bold; color: var(--primary-color);">${stats.total_projects}</div>
                    <div style="color: var(--text-secondary);">Projetos Criados</div>
                </div>
                <div style="text-align: center; padding: 15px; background: var(--card-bg); border-radius: 8px;">
                    <div style="font-size: 2em; font-weight: bold; color: var(--primary-color);">⭐${stats.average_rating.toFixed(1)}</div>
                    <div style="color: var(--text-secondary);">Avaliação Média</div>
                </div>
                <div style="text-align: center; padding: 15px; background: var(--card-bg); border-radius: 8px;">
                    <div style="font-size: 2em; font-weight: bold; color: var(--primary-color);">${user.reputation_score.toFixed(1)}</div>
                    <div style="color: var(--text-secondary);">Reputação</div>
                </div>
            </div>

            <h3 style="margin-bottom: 15px;">Avaliações Recentes</h3>
            <div style="max-height: 400px; overflow-y: auto;">
                ${reviewsHTML}
            </div>

            <div style="margin-top: 20px; text-align: center;">
                <button class="btn-secondary" onclick="closeModal()">Fechar</button>
            </div>
        </div>
    `;

    showModal('clientDetailsModal');
}
