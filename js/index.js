/*
================================================================================
  [ 앱 아키텍처 (Class + 함수형 혼합) ]

  - AppState (객체): 앱의 전역 상태(로그인 여부, 현재 필터 등)를 관리하는 단일 소스.
  - ProjectManager (Class): 프로젝트 데이터의 CRUD(생성, 읽기, 수정, 삭제) 로직을 캡슐화.
  - UI Functions (함수 그룹): 상태(State)에 따라 DOM을 렌더링하고 UI를 업데이트.
  - Event Handlers (함수 그룹): 사용자의 상호작용(클릭, 제출 등)을 처리.
  - Initialization (초기화 함수): 앱이 시작될 때 모든 기능을 조립하고 실행.
================================================================================
*/

// =============================================================================
// [1. 데이터 및 상태 관리 (Data & State Management)]
// =============================================================================

/**
 * @description 개발 철학 인용구 데이터. About 섹션의 슬라이더에 사용됩니다.
 */
const quotes = [
   {
      text: '말은 쉽지, 코드를 보여줘. \n (Talk is cheap. Show me the code.)',
      author: 'Linus Torvalds',
      source: '리눅스 창시자',
   },
   {
      text: '좋은 UI는 농담과 같다. \n 설명할 필요가 없다면, 그만큼 좋은 것이다.',
      author: 'Martin LeBlanc',
      source: 'UI/UX 디자이너',
   },
   {
      text: '단순함은 신뢰성의 전제 조건이다. \n (Simplicity is a prerequisite for reliability.)',
      author: 'Edsger W. Dijkstra',
      source: '컴퓨터 과학자',
   },
   {
      text: '코드는 사라지기 위해 작성된다. \n 하지만 아키텍처는 영원하다.',
      author: 'Robert C. Martin',
      source: "책 '클린 아키텍처'",
   },
   {
      text: "측정할 수 없다면, 개선할 수 없다. \n (You can't improve what you don't measure.)",
      author: 'Peter Drucker',
      source: '경영학자 (웹 성능 최적화의 핵심)',
   },
   {
      text: '오늘 하나의 버그를 수정하는 것이, \n 내일 새로운 기능을 추가하는 것보다 낫다.',
      author: 'Software Engineering Proverb',
      source: '소프트웨어 공학 격언',
   },
   {
      text: '단순함은 궁극의 정교함이다. \n(Simplicity is the ultimate sophistication.)',
      author: 'Leonardo da Vinci',
      source: '예술가',
   },
   {
      text: '두 번 이상 반복한다면, 자동화하라. \n (Once and only once.)',
      author: 'The Pragmatic Programmer',
      source: "책 '실용주의 프로그래머'",
   },
];

/**
 * @class ProjectManager
 * @description 프로젝트 데이터 관리 클래스. 로컬 스토리지와 상호작용하며 데이터 CRUD를 담당.
 */
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

/**
 * @const AppState
 * @description 애플리케이션의 전역 상태를 관리하는 객체.
 */
const AppState = {
   isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
   currentFilter: 'all',
   scrollbar: null,
};

// =============================================================================
// [2. UI 렌더링 및 업데이트 (UI Rendering & Updates)]
// =============================================================================

/**
 * @description 로그인 상태(AppState.isLoggedIn)에 따라 UI를 업데이트하는 함수.
 */
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

/**
 * @description 주어진 프로젝트 데이터 배열을 기반으로 프로젝트 그리드를 렌더링.
 * @param {Array} projectsToRender - 화면에 표시할 프로젝트 객체 배열.
 */
function renderProjects(projectsToRender) {
   const projectGrid = document.getElementById('project-grid');
   projectGrid.innerHTML = '';
   if (projectsToRender.length === 0) {
      projectGrid.innerHTML =
         '<p class="empty-message">표시할 프로젝트가 없습니다.</p>';
      return;
   }
   projectsToRender.forEach((p, index) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'project-item';
      itemEl.setAttribute('data-animation', 'fade-in-up');
      itemEl.style.transitionDelay = `${index * 0.15}s`;

      const adminButtonsHTML = `
           <div class="admin-actions">
               <button class="edit-btn" data-id="${p.id}">수정</button>
               <button class="delete-btn" data-id="${p.id}">삭제</button>
           </div>
       `;

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

   setupScrollAnimations();
}

/**
 * @description 현재 필터(AppState.currentFilter)에 맞게 프로젝트를 필터링하고 렌더링.
 */
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

/**
 * @description About 섹션의 인용구 슬라이더를 업데이트.
 */
// ===== [수정] 슬라이더 관련 변수를 함수 외부에서도 접근 가능하도록 전역 스코프에 선언 =====
let quoteTextEl, quoteAuthorEl, quoteSourceEl;
let currentQuoteIndex = 0;

function showNextQuote() {
   if (!quoteTextEl) return;
   quoteTextEl.classList.add('fading-out');
   setTimeout(() => {
      currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
      const nextQuote = quotes[currentQuoteIndex];
      quoteTextEl.textContent = `"${nextQuote.text}"`;
      quoteAuthorEl.textContent = `- ${nextQuote.author}`;
      quoteSourceEl.textContent = nextQuote.source;
      quoteTextEl.classList.remove('fading-out');
   }, 500);
}

/**
 * @description Chart.js를 사용하여 스킬 차트를 생성 및 업데이트.
 */
function createSkillChart() {
   const ctx = document.getElementById('skill-radar-chart');
   if (!ctx) return;

   if (ctx.chart) {
      ctx.chart.destroy();
   }

   const getResponsiveFontSize = () => {
      const screenWidth = window.innerWidth;
      if (screenWidth >= 1024) return 14;
      if (screenWidth >= 768) return 12;
      if (screenWidth >= 500) return 8;
      if (screenWidth >= 480) return 5;
      return 5;
   };
   const currentFontSize = getResponsiveFontSize();

   const skillData = {
      labels: [
         'HTML/CSS',
         'JavaScript',
         'React',
         'jQuery',
         'Tailwind CSS',
         'Figma',
         'GitHub',
         'Oracle',
      ],
      datasets: [
         {
            label: '기술 숙련도',
            data: [9, 5, 3.5, 5, 7, 4, 5, 2.5],

            backgroundColor: [
               'rgba(227, 76, 38, 0.6)',
               'rgba(247, 223, 30, 0.6)',
               'rgba(97, 218, 251, 0.6)',
               'rgba(17, 105, 175, 0.6)',
               'rgba(56, 189, 248, 0.6)',
               'rgba(242, 78, 34, 0.6)',
               'rgba(24, 23, 23, 0.6)',
               'rgba(248, 0, 0, 0.6)',
            ],

            borderColor: [
               'rgba(227, 76, 38, 1)',
               'rgba(247, 223, 30, 1)',
               'rgba(97, 218, 251, 1)',
               'rgba(17, 105, 175, 1)',
               'rgba(56, 189, 248, 1)',
               'rgba(242, 78, 34, 1)',
               'rgba(24, 23, 23, 1)',
               'rgba(248, 0, 0, 1)',
            ],
            borderWidth: 1,
            borderRadius: 5,
         },
      ],
   };

   const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
         x: {
            grid: { display: false },
            ticks: { font: { size: currentFontSize, weight: '500' } },
         },
         y: {
            beginAtZero: true,
            max: 10,
            ticks: { stepSize: 1 },
         },
      },
      plugins: {
         legend: { display: false },
         tooltip: {
            callbacks: {
               label: function (context) {
                  return `숙련도: ${context.parsed.y} / 10 점`;
               },
            },
         },
      },
   };

   ctx.chart = new Chart(ctx, {
      type: 'bar',
      data: skillData,
      options: chartOptions,
   });
}

// =============================================================================
// [3. 이벤트 핸들러 및 유틸리티 (Event Handlers & Utilities)]
// =============================================================================

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

function openModal(modalElement) {
   if (!modalElement) return;
   document.body.classList.add('modal-open');
   const currentScrollY = AppState.scrollbar.offset.y;
   modalElement.style.top = `${currentScrollY}px`;
   modalElement.classList.add('visible');
}

function closeModal(modalElement) {
   if (!modalElement) return;
   document.body.classList.remove('modal-open');
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

function setupScrollAnimations() {
   const scrollElements = document.querySelectorAll('[data-animation]');

   if (!scrollElements.length) return;

   const observer = new IntersectionObserver(
      (entries) => {
         entries.forEach((entry) => {
            if (entry.isIntersecting) {
               entry.target.classList.add('is-visible');
            } else {
               entry.target.classList.remove('is-visible');
            }
         });
      },
      {
         threshold: 0.1,
      },
   );

   scrollElements.forEach((el) => {
      observer.observe(el);
   });
}

function initializeContactSection() {
   const emailBox = document.getElementById('email-box');
   const copyToast = document.getElementById('copy-toast');

   if (emailBox) {
      emailBox.addEventListener('click', () => {
         const email = emailBox.dataset.email;

         navigator.clipboard
            .writeText(email)
            .then(() => {
               copyToast.classList.add('show');
               setTimeout(() => {
                  copyToast.classList.remove('show');
               }, 2000);
            })
            .catch((err) => {
               console.error('이메일 복사 실패:', err);
               alert('이메일 복사에 실패했습니다.');
            });
      });
   }
}

function initializeMap() {
   const mapContainer = document.getElementById('map');
   if (!mapContainer || !window.kakao) return;

   const ilsanPosition = new kakao.maps.LatLng(37.663, 126.766);
   const seoulPosition = new kakao.maps.LatLng(37.5665, 126.978);

   const centerLat = (ilsanPosition.getLat() + seoulPosition.getLat()) / 2;
   const centerLng = (ilsanPosition.getLng() + seoulPosition.getLng()) / 2;

   const mapOption = {
      center: new kakao.maps.LatLng(centerLat, centerLng),
      level: 10,
   };

   const map = new kakao.maps.Map(mapContainer, mapOption);

   const createMarkerAndInfoWindow = (position, message) => {
      const marker = new kakao.maps.Marker({ position });
      marker.setMap(map);

      const infowindow = new kakao.maps.InfoWindow({
         content: `<div style="padding:5px; font-size:14px; text-align:center;">${message}</div>`,
         removable: true,
      });

      kakao.maps.event.addListener(marker, 'click', function () {
         infowindow.open(map, marker);
      });
   };

   createMarkerAndInfoWindow(
      seoulPosition,
      '수도권 어디든<br>성장할 준비가 되어있습니다!',
   );
   createMarkerAndInfoWindow(ilsanPosition, '유연한 근무가<br>가능합니다!');
}

// =============================================================================
// [4. 애플리케이션 초기화 (Application Initialization)]
// =============================================================================

/**
 * @description 애플리케이션의 모든 기능을 시작하는 메인 함수.
 */
async function initializeApp() {
   // --- 1. 인스턴스 및 DOM 요소 캐싱 ---
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
   const progressBar = document.querySelector('.progress-bar');
   const sections = document.querySelectorAll('section');
   const wavyText = document.querySelector('.wavy-text');

   quoteTextEl = document.querySelector('.quote-text');
   quoteAuthorEl = document.querySelector('.quote-author');
   quoteSourceEl = document.querySelector('.quote-source');

   // --- 2. Smooth Scrollbar 초기화 ---
   const scrollbar = Scrollbar.init(document.querySelector('.wrapper'), {
      damping: 0.07,
   });
   AppState.scrollbar = scrollbar;
   const scrollPos = localStorage.getItem('scrollPos');
   if (scrollPos) scrollbar.setPosition(0, parseInt(scrollPos));

   // --- 3. 이벤트 리스너 바인딩 ---
   scrollbar.addListener((status) => {
      localStorage.setItem('scrollPos', status.offset.y);
      const scrollPercentage = (status.offset.y / status.limit.y) * 100;
      progressBar.style.width = `${scrollPercentage}%`;
      let currentSection = sections[0];
      sections.forEach((section) => {
         if (section.offsetTop <= status.offset.y + 100) {
            currentSection = section;
         }
      });
      const newColor = currentSection.dataset.color || '#3498db';
      progressBar.style.backgroundColor = newColor;
   });

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
         if (e.target.classList.contains('delete-btn')) {
            if (!AppState.isLoggedIn) {
               alert('관리자 로그인이 필요한 기능입니다.');
               return;
            }
            const projectId = Number(e.target.dataset.id);
            if (confirm(`프로젝트를 정말 삭제하시겠습니까?`)) {
               projectManager.deleteProject(projectId);
               filterAndRenderProjects();
            }
         }

         if (e.target.classList.contains('edit-btn')) {
            if (!AppState.isLoggedIn) {
               alert('관리자 로그인이 필요한 기능입니다.');
               return;
            }
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

   // --- 4. UI 및 기능 초기 실행 ---
   if (wavyText) {
      const text = wavyText.textContent.trim();
      wavyText.innerHTML = '';
      text.split('').forEach((char, index) => {
         const span = document.createElement('span');
         span.textContent = char;
         span.style.setProperty('--i', index);
         wavyText.appendChild(span);
      });
   }

   updateAuthUI();
   setInterval(showNextQuote, 5000);
   createSkillChart();
   let resizeTimer;
   window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
         createSkillChart();
      }, 150);
   });

   const projectGridInitialHTML =
      document.getElementById('project-grid').innerHTML;
   document.getElementById('project-grid').innerHTML = projectGridInitialHTML;
   await new Promise((resolve) => setTimeout(resolve, 500));
   await projectManager.fetchInitialProjects();
   filterAndRenderProjects();

   setupScrollAnimations();
   initializeContactSection();

   kakao.maps.load(function () {
      initializeMap();
   });
}

// ===== [5. 앱 실행] =====
document.addEventListener('DOMContentLoaded', initializeApp);
