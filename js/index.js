/*
================================================================================
  [ 앱 아키텍처 (Class + 함수형 혼합) ]

  - ProjectManager (Class): `fetch`로 프로젝트 데이터를 비동기 로딩하고, CRUD 로직을 담당.
  - AppState (객체): 앱의 전역 상태(로그인, 필터)를 관리.
  - UI Functions (함수): 상태(State)에 따라 DOM을 렌더링.
  - initializeApp (함수): 앱의 모든 기능을 조립하고 실행.
================================================================================
*/

// ===== [클래스] 프로젝트 데이터 관리자 =====
class ProjectManager {
   constructor() {
      this.projects = JSON.parse(localStorage.getItem('projects')) || [];
   }
   async fetchInitialProjects() {
      if (this.projects.length > 0) return this.projects;
      try {
         const response = await fetch('./data/projects.json');
         if (!response.ok)
            throw new Error('프로젝트 데이터를 불러오는 데 실패했습니다.');
         this.projects = await response.json();
         this._saveData();
         return this.projects;
      } catch (error) {
         console.error(error);
         return [];
      }
   }
   _saveData() {
      localStorage.setItem('projects', JSON.stringify(this.projects));
   }
   getProjects() {
      return this.projects;
   }
   getProjectById(id) {
      return this.projects.find((p) => p.id === id);
   }
   createProject(projectData) {
      const newId =
         this.projects.length > 0
            ? Math.max(...this.projects.map((p) => p.id)) + 1
            : 1;
      this.projects.push({ id: newId, ...projectData });
      this._saveData();
   }
   updateProject(projectId, updates) {
      const projectIndex = this.projects.findIndex((p) => p.id === projectId);
      if (projectIndex !== -1) {
         this.projects[projectIndex] = {
            ...this.projects[projectIndex],
            ...updates,
         };
         this._saveData();
      }
   }
   deleteProject(projectId) {
      this.projects = this.projects.filter((p) => p.id !== projectId);
      this._saveData();
   }
   clearAllProjects() {
      this.projects = [];
      this._saveData();
   }
}

// ===== [객체] 앱의 전역 상태 관리 =====
const AppState = {
   isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
   currentFilter: 'all',
   scrollbar: null,
};

// ===== [함수] UI 업데이트 로직 =====
function updateAuthUI() {
   const authBtnText = document.getElementById('auth-btn-text');
   const adminControls = document.getElementById('admin-controls');

   if (AppState.isLoggedIn) {
      authBtnText.textContent = '로그아웃';
      adminControls.classList.add('visible');
   } else {
      authBtnText.textContent = '관리자';
      adminControls.classList.remove('visible');
   }
   filterAndRenderProjects();
}

// ===== [함수] 이벤트 핸들러 및 기타 로직 =====
function handleLogin() {
   AppState.isLoggedIn = true;
   localStorage.setItem('isLoggedIn', 'true');
   updateAuthUI();
   alert('로그인 성공!');
   closeAdminModal();
}

function handleLogout() {
   AppState.isLoggedIn = false;
   localStorage.removeItem('isLoggedIn');
   updateAuthUI();
   alert('로그아웃 되었습니다.');
}

// 범용 모달 열기/닫기 함수 (스크롤 위치 보정)
function openModal(modalElement) {
   if (!modalElement) return;
   const currentScrollY = AppState.scrollbar.offset.y;
   modalElement.style.top = `${currentScrollY}px`;
   modalElement.classList.add('visible');
}

function closeModal(modalElement) {
   if (!modalElement) return;
   modalElement.classList.remove('visible');
}

function openAdminModal() {
   openModal(document.getElementById('admin-modal-wrapper'));
}
function closeAdminModal() {
   const modal = document.getElementById('admin-modal-wrapper');
   closeModal(modal);
   modal.querySelector('#admin-login-form')?.reset();
}

function openProjectFormModalForCreate() {
   if (!AppState.isLoggedIn) {
      alert('관리자 로그인이 필요한 기능입니다.');
      return;
   }
   const modal = document.getElementById('project-form-modal');
   modal.querySelector('#project-form-title').textContent = '새 프로젝트 추가';
   modal.querySelector('#project-form').reset();
   modal.querySelector('#project-id').value = '';
   openModal(modal);
}

function openProjectFormModalForEdit(project) {
   if (!AppState.isLoggedIn) {
      alert('관리자 로그인이 필요한 기능입니다.');
      return;
   }
   const modal = document.getElementById('project-form-modal');
   modal.querySelector('#project-form-title').textContent = '프로젝트 수정';
   modal.querySelector('#project-id').value = project.id;
   modal.querySelector('#project-title').value = project.title;
   modal.querySelector('#project-headline').value = project.headline;
   modal.querySelector('#project-imageSrc').value = project.imageSrc;
   modal.querySelector('#project-overview').value = project.overview;
   modal.querySelector('#project-techStack').value =
      project.techStack.join(', ');
   modal.querySelector('#project-category').value = project.category.join(', ');
   modal.querySelector('#project-github').value = project.links.github;
   modal.querySelector('#project-site').value = project.links.site;
   openModal(modal);
}

function closeProjectFormModal() {
   const modal = document.getElementById('project-form-modal');
   closeModal(modal);
   modal.querySelector('#project-form')?.reset();
}

// ===== [함수] UI 렌더링 및 필터링 =====
let projectManagerInstance;

function renderProjects(projectsToRender) {
   const projectGrid = document.getElementById('project-grid');
   projectGrid.innerHTML = '';
   if (projectsToRender.length === 0) {
      projectGrid.innerHTML =
         '<p class="empty-message">표시할 프로젝트가 없습니다.</p>';
      return;
   }
   projectsToRender.forEach((p) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'project-item';

      const adminButtonsHTML = AppState.isLoggedIn
         ? `
           <div class="admin-actions">
               <button class="edit-btn" data-id="${p.id}">수정</button>
               <button class="delete-btn" data-id="${p.id}">삭제</button>
           </div>
       `
         : '';

      itemEl.innerHTML = `
           <a href="${p.links.site}" target="_blank" class="project-link">
               <div class="project-image"><img src="${p.imageSrc}" alt="${p.title}" loading="lazy"></div>
               <div class="project-info">
                   <h3>${p.title}</h3>
                   <p class="headline">${p.headline}</p>
                   <div class="tags">${p.category.map((tag) => `<span class="tag">#${tag}</span>`).join(' ')}</div>
               </div>
           </a>
           ${adminButtonsHTML} 
       `;
      projectGrid.appendChild(itemEl);
   });
}

function filterAndRenderProjects() {
   if (!projectManagerInstance) return;
   const allProjects = projectManagerInstance.getProjects();
   if (AppState.currentFilter === 'all') {
      renderProjects(allProjects);
   } else {
      const filtered = allProjects.filter((p) =>
         p.category.includes(AppState.currentFilter),
      );
      renderProjects(filtered);
   }
}

// ===== [함수] 앱 전체를 시작하는 초기화 함수 =====
async function initializeApp() {
   projectManagerInstance = new ProjectManager();
   const projectManager = projectManagerInstance;

   const authBtn = document.getElementById('admin-auth-btn');
   const createProjectBtn = document.getElementById('create-project-btn');
   const deleteAllBtn = document.getElementById('delete-all-btn');
   const projectGrid = document.getElementById('project-grid');
   const adminModal = document.getElementById('admin-modal-wrapper');
   const loginForm = document.getElementById('admin-login-form');
   const filterButtons = document.querySelectorAll('.filter-btn');
   const projectFormModal = document.getElementById('project-form-modal');
   const projectForm = document.getElementById('project-form');

   const scrollbar = Scrollbar.init(document.querySelector('.wrapper'), {
      damping: 0.07,
   });
   AppState.scrollbar = scrollbar;
   const scrollPos = localStorage.getItem('scrollPos');
   if (scrollPos) scrollbar.setPosition(0, parseInt(scrollPos));
   scrollbar.addListener((status) =>
      localStorage.setItem('scrollPos', status.offset.y),
   );

   if (authBtn) {
      authBtn.addEventListener('click', () => {
         if (AppState.isLoggedIn) {
            if (confirm('로그아웃 하시겠습니까?')) handleLogout();
         } else {
            openAdminModal();
         }
      });
   }

   if (createProjectBtn) {
      createProjectBtn.addEventListener('click', openProjectFormModalForCreate);
   }

   if (deleteAllBtn) {
      deleteAllBtn.addEventListener('click', () => {
         if (!AppState.isLoggedIn) {
            alert('관리자 로그인이 필요한 기능입니다.');
            return;
         }
         if (confirm('모든 프로젝트를 정말 삭제하시겠습니까?')) {
            projectManager.clearAllProjects();
            filterAndRenderProjects();
            alert('모든 프로젝트가 삭제되었습니다.');
         }
      });
   }

   if (projectGrid) {
      projectGrid.addEventListener('click', (e) => {
         if (!AppState.isLoggedIn) return;
         if (e.target.classList.contains('delete-btn')) {
            const projectId = Number(e.target.dataset.id);
            if (confirm(`프로젝트를 정말 삭제하시겠습니까?`)) {
               projectManager.deleteProject(projectId);
               filterAndRenderProjects();
            }
         }
         if (e.target.classList.contains('edit-btn')) {
            const projectId = Number(e.target.dataset.id);
            const projectToEdit = projectManager.getProjectById(projectId);
            if (projectToEdit) {
               openProjectFormModalForEdit(projectToEdit);
            }
         }
      });
   }

   if (adminModal) {
      adminModal
         .querySelector('.modal-close-btn')
         .addEventListener('click', closeAdminModal);
      adminModal.addEventListener('click', (e) => {
         if (e.target === adminModal) closeAdminModal();
      });
   }

   if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
         e.preventDefault();
         const idInput = document.getElementById('id');
         const pwInput = document.getElementById('pw');
         if (idInput.value === 'admin' && pwInput.value === '1234') {
            handleLogin();
         } else {
            alert('아이디 또는 비밀번호가 일치하지 않습니다.');
         }
      });
   }

   if (filterButtons) {
      filterButtons.forEach((button) => {
         button.addEventListener('click', (e) => {
            AppState.currentFilter = e.target.dataset.filter;
            filterButtons.forEach((btn) => btn.classList.remove('active'));
            e.target.classList.add('active');
            filterAndRenderProjects();
         });
      });
   }

   if (projectFormModal) {
      projectFormModal
         .querySelector('.modal-close-btn')
         .addEventListener('click', closeProjectFormModal);
      projectFormModal.addEventListener('click', (e) => {
         if (e.target === projectFormModal) closeProjectFormModal();
      });
   }

   if (projectForm) {
      projectForm.addEventListener('submit', (e) => {
         e.preventDefault();
         if (!AppState.isLoggedIn) {
            alert('권한이 없습니다.');
            return;
         }
         const projectId = Number(document.getElementById('project-id').value);
         const projectData = {
            title: document.getElementById('project-title').value,
            headline: document.getElementById('project-headline').value,
            imageSrc: document.getElementById('project-imageSrc').value,
            overview: document.getElementById('project-overview').value,
            techStack: document
               .getElementById('project-techStack')
               .value.split(',')
               .map((s) => s.trim()),
            category: document
               .getElementById('project-category')
               .value.split(',')
               .map((s) => s.trim()),
            links: {
               github: document.getElementById('project-github').value,
               site: document.getElementById('project-site').value,
            },
         };
         if (projectId) {
            projectManager.updateProject(projectId, projectData);
            alert('프로젝트가 성공적으로 수정되었습니다.');
         } else {
            projectManager.createProject(projectData);
            alert('프로젝트가 성공적으로 추가되었습니다.');
         }
         filterAndRenderProjects();
         closeProjectFormModal();
      });
   }

   updateAuthUI();

   const projectGridInitialHTML =
      document.getElementById('project-grid').innerHTML;
   document.getElementById('project-grid').innerHTML = projectGridInitialHTML;
   await new Promise((resolve) => setTimeout(resolve, 500));

   await projectManager.fetchInitialProjects();
   filterAndRenderProjects();
}

document.addEventListener('DOMContentLoaded', initializeApp);
