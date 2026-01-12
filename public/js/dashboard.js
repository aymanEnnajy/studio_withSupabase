/**
 * Dashboard JavaScript
 * Handles user studio management
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!window.AppState.isAuthenticated) {
        window.location.href = 'login.html';
        return;
    }

    await loadMyStudios();
});

async function loadMyStudios() {
    const grid = document.getElementById('myStudiosGrid');
    const totalCount = document.getElementById('totalStudios');

    try {
        const studios = await API.get('/auth/my-items');
        totalCount.textContent = studios.length;

        if (studios.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <div class="empty-state-icon">
                        <i class="fas fa-camera"></i>
                    </div>
                    <h3>Vous n'avez pas encore de studio</h3>
                    <p>Commencez par ajouter votre premier studio photo</p>
                    <a href="add-studio.html" class="btn btn-primary" style="margin-top: 1rem;">
                        Ajouter un Studio
                    </a>
                </div>
            `;
            return;
        }

        grid.innerHTML = studios.map((studio, index) => `
            <div class="studio-card dashboard-card" data-aos="fade-up" data-aos-delay="${index * 100}">
                <div class="studio-card-image">
                    <div class="studio-badge ${studio.status}">${studio.status === 'available' ? 'Disponible' : 'Réservé'}</div>
                    ${studio.image ? `<img src="${studio.image}" alt="${studio.name}" style="width: 100%; height: 100%; object-fit: cover;">` : `
                    <div class="image-placeholder">
                        <i class="fas fa-image"></i>
                    </div>`}
                </div>
                <div class="studio-card-content">
                    <div class="studio-header">
                        <h3 class="studio-name">${studio.name}</h3>
                        <div class="studio-rating">
                            <i class="fas fa-star"></i>
                            <span>${studio.average_rating || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="studio-location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${studio.city}</span>
                    </div>
                    <div class="studio-footer">
                        <div class="studio-price">
                            <span class="price-amount">${studio.price_per_hour} DH</span>
                            <span class="price-unit">/heure</span>
                        </div>
                    </div>
                    <div class="dashboard-actions">
                        <a href="add-studio.html?id=${studio.id}" class="btn btn-outline btn-sm">
                            <i class="fas fa-edit"></i> Modifier
                        </a>
                        <button class="btn btn-danger btn-sm" onclick="deleteStudio(${studio.id})">
                            <i class="fas fa-trash"></i> Supprimer
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Failed to load studios:', error);
        grid.innerHTML = '<div class="error">Erreur lors du chargement de vos studios</div>';
    }
}

// Make delete function global
window.deleteStudio = openDeleteModal;

let studioIdToDelete = null;

function openDeleteModal(id) {
    studioIdToDelete = id;
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeDeleteModal() {
    studioIdToDelete = null;
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Initialize Modal Events
document.addEventListener('DOMContentLoaded', () => {
    const cancelBtn = document.getElementById('cancelDeleteBtn');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const modal = document.getElementById('deleteModal');

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeDeleteModal);
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            if (studioIdToDelete) {
                await performDelete(studioIdToDelete);
                closeDeleteModal();
            }
        });
    }

    // Close on click outside
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeDeleteModal();
            }
        });
    }
});

async function performDelete(id) {
    try {
        await API.delete(`/items/${id}`);
        // Remove card from UI immediately if possible or reload
        const card = document.querySelector(`button[onclick="deleteStudio(${id})"]`).closest('.studio-card');
        if (card) {
            // Animate removal
            card.style.transition = 'all 0.3s ease';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.9)';
            setTimeout(() => {
                loadMyStudios(); // Reload list to ensure correct count and state
            }, 300);
        } else {
            loadMyStudios();
        }
        window.showNotification('Studio supprimé avec succès', 'success');
    } catch (error) {
        console.error('Delete failed:', error);
        window.showNotification(error.message || 'Erreur lors de la suppression', 'error');
    }
}
