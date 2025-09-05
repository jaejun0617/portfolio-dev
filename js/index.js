/*
================================================================================
  [ 앱 아키텍처 (Firebase 연동) ]

  - Firebase Services: Firestore(DB), Authentication(인증)을 백엔드로 사용.
  - AppState (객체): 앱의 전역 상태를 관리하는 단일 소스.
  - UI Functions (함수 그룹): 상태(State)에 따라 DOM을 렌더링.
  - Event Handlers (함수 그룹): 사용자의 상호작용을 처리하고 Firebase와 통신.
  - Initialization (초기화 함수): 앱 시작 시 모든 기능을 조립하고 Firebase 리스너를 연결.
================================================================================
*/

// [1. Firebase SDK 및 서비스 초기화]
import { initializeApp as initializeFirebaseApp } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js';
import {
   getAuth,
   createUserWithEmailAndPassword,
   signInWithEmailAndPassword,
   signOut,
   onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js';
import {
   getFirestore,
   collection,
   onSnapshot,
   addDoc,
   doc,
   updateDoc,
   deleteDoc,
} from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js';
import { gsap } from 'https://cdn.skypack.dev/gsap';
import { SplitText } from 'https://cdn.skypack.dev/gsap/SplitText';
// [중요] 당신의 Firebase 웹 앱 구성 객체
const firebaseConfig = {
   apiKey: 'AIzaSyCZN2y1gIer8KWmi9q-Md-LOqn71c3G4m0',
   authDomain: 'my-portfoilo-2025.firebaseapp.com',
   projectId: 'my-portfoilo-2025',
   storageBucket: 'my-portfoilo-2025.appspot.com',
   messagingSenderId: '288065246579',
   appId: '1:288065246579:web:0e619cd72e5f505aede106',
   measurementId: 'G-ZHFL6XBQJ4',
};

// Firebase 앱 초기화
console.log('[Firebase] 앱 초기화 시작...');
const app = initializeFirebaseApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const projectsCollection = collection(db, 'projects'); // 'projects' 컬렉션에 대한 참조
console.log('[Firebase] 앱 초기화 완료.');

// =============================================================================
// [2. 데이터 및 상태 관리 (Data & State Management)]
// =============================================================================

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

const AppState = {
   isLoggedIn: false,
   currentFilter: 'all',
   scrollbar: null,
   projects: [],
};

// =============================================================================
// [3. UI 렌더링 및 업데이트 (UI Rendering & Updates)]
// =============================================================================

function updateAuthUI() {
   console.log('[UI] 인증 상태 UI 업데이트. 로그인 상태:', AppState.isLoggedIn);
   const authBtnText = document.getElementById('auth-btn-text');
   const adminControls = document.querySelector('.admin-controls');

   authBtnText.textContent = AppState.isLoggedIn ? '로그아웃' : '관리자';

   if (adminControls) {
      adminControls.style.display = AppState.isLoggedIn ? 'flex' : 'none';
   }
   filterAndRenderProjects();
}

function renderProjects(projectsToRender) {
   console.log(`[UI] 프로젝트 렌더링. ${projectsToRender.length}개 항목.`);
   const projectGrid = document.getElementById('project-grid');
   projectGrid.innerHTML = '';
   if (!projectsToRender || projectsToRender.length === 0) {
      projectGrid.innerHTML =
         '<p class="empty-message">표시할 프로젝트가 없습니다. 관리자로 로그인하여 프로젝트를 추가해주세요.</p>';
      return;
   }
   projectsToRender.forEach((p, index) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'project-item';
      itemEl.setAttribute('data-animation', 'fade-in-up');
      itemEl.style.transitionDelay = `${index * 0.15}s`;

      const adminButtonsHTML = AppState.isLoggedIn
         ? `
           <div class="admin-actions">
               <button class="edit-btn" data-id="${p.id}">수정</button>
               <button class="delete-btn" data-id="${p.id}">삭제</button>
           </div>`
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
           ${adminButtonsHTML}`;
      projectGrid.appendChild(itemEl);
   });
   setupScrollAnimations();
}

function filterAndRenderProjects() {
   console.log(
      `[UI] 프로젝트 필터링 및 렌더링. 현재 필터: ${AppState.currentFilter}`,
   );
   const allProjects = AppState.projects;
   if (AppState.currentFilter === 'all') {
      renderProjects(allProjects);
   } else {
      const filtered = allProjects.filter((p) =>
         p.category.includes(AppState.currentFilter),
      );
      renderProjects(filtered);
   }
}

let quoteTextEl, quoteAuthorEl, quoteSourceEl;
let currentQuoteIndex = 0;

function initializeQuote() {
   if (!quoteTextEl) return;
   const firstQuote = quotes[0];
   quoteTextEl.textContent = `"${firstQuote.text}"`;
   quoteAuthorEl.textContent = `- ${firstQuote.author}`;
   quoteSourceEl.textContent = firstQuote.source;
}

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

function createSkillChart() {
   console.log('[UI] 기술 차트 생성.');
   const ctx = document.getElementById('skill-radar-chart');
   if (!ctx) return;
   if (ctx.chart) {
      ctx.chart.destroy();
   }
   const getResponsiveFontSize = () => {
      const screenWidth = window.innerWidth;
      if (screenWidth >= 1024) return 14;
      if (screenWidth >= 768) return 10;
      if (screenWidth >= 767) return 10;
      if (screenWidth >= 480) return 8;
      return 4;
   };
   const skillData = {
      labels: [
         'HTML/CSS',
         'JavaScript',
         'React',
         'jQuery',
         'Tailwind CSS',
         'Figma',
         'GitHub',
         'Firebase',
         'Oracle',
      ],
      datasets: [
         {
            label: '기술 숙련도',
            data: [9, 5, 3.5, 5, 7, 4, 5, 4, 2.5],
            backgroundColor: [
               'rgba(227, 76, 38, 0.6)', // HTML/CSS
               'rgba(247, 223, 30, 0.6)', // JavaScript
               'rgba(97, 218, 251, 0.6)', // React
               'rgba(17, 105, 175, 0.6)', // jQuery
               'rgba(56, 189, 248, 0.6)', // Tailwind CSS
               'rgba(242, 78, 34, 0.6)', // Figma
               'rgba(24, 23, 23, 0.6)', // GitHub
               'rgba(255, 202, 40, 0.6)', // Firebase
               'rgba(52, 90, 138, 0.6)', // Oracle
            ],
            borderColor: [
               'rgba(227, 76, 38, 1)',
               'rgba(247, 223, 30, 1)',
               'rgba(97, 218, 251, 1)',
               'rgba(17, 105, 175, 1)',
               'rgba(56, 189, 248, 1)',
               'rgba(242, 78, 34, 1)',
               'rgba(24, 23, 23, 1)',
               'rgba(255, 202, 40, 1)', // Firebase
               'rgba(52, 90, 138, 1)', // Oracle
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
            ticks: { font: { size: getResponsiveFontSize(), weight: '500' } },
         },
         y: { beginAtZero: true, max: 10, ticks: { stepSize: 1 } },
      },
      plugins: {
         legend: { display: false },
         tooltip: {
            callbacks: {
               label: (context) => `숙련도: ${context.parsed.y} / 10 점`,
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
function animateHeroSection() {
   console.log('[GSAP] Hero "Cosmic Genesis" Animation 시작');

   gsap.registerPlugin(SplitText);

   const line1 = new SplitText('.line1', { type: 'chars' });
   const line2 = new SplitText('.line2', { type: 'chars' });
   const line3 = new SplitText('.line3', { type: 'chars' });
   const line4 = new SplitText('.line4', { type: 'chars' });
   const highlights = gsap.utils.toArray('.highlight');

   const allChars = [
      ...line1.chars,
      ...line2.chars,
      ...line3.chars,
      ...line4.chars,
   ];
   const regularChars = allChars.filter(
      (char) => !char.parentElement.classList.contains('highlight'),
   );

   const tl = gsap.timeline();
   const isMobile = window.innerWidth <= 768;

   // 1️⃣ 초기 상태 설정
   gsap.set(highlights, { color: '#000000', autoAlpha: 1 }); // 하이라이트는 검정색, 그러나 보이게
   gsap.set(regularChars, { color: '#ffffff', autoAlpha: 1 }); // 일반 글자 흰색, 보이게
   gsap.set('.hero-profile-image', { autoAlpha: 0 }); // 프로필은 완전히 숨김

   // 2️⃣ "Cosmic Genesis" - 글자 흩어짐과 응집
   tl.from(allChars, {
      duration: isMobile ? 2.0 : 2.5,

      // ✨ [핵심 이펙트] 3D 공간에 무작위로 흩뿌려진 상태에서 시작
      x: () => gsap.utils.random(-300, 300, 5), // x, y, z 좌표를 정밀하게 랜덤화
      y: () => gsap.utils.random(-400, 400, 5),
      z: () => gsap.utils.random(-1000, 1000, 10),

      // ✨ [핵심 이펙트] 회전 및 크기
      rotationX: () => gsap.utils.random(-720, 720),
      rotationY: () => gsap.utils.random(-720, 720),
      scale: () => gsap.utils.random(0.1, 0.5),

      // ✨ [핵심 이펙트] 시각 효과
      opacity: 0,
      filter: 'blur(15px)', // 블러 효과로 시작

      ease: 'expo.inOut', // 매우 부드럽고 극적인 움직임

      // ✨ [핵심 이펙트] 정교한 순차 실행
      stagger: {
         each: 0.02,
         from: 'random', // '무작위' 순서로 각 글자가 제자리를 찾아옴
      },
   });

   // 3️⃣ 하이라이트 공개 및 효과
   tl.to(
      highlights,
      {
         color: '#5c3422',
         textShadow:
            '0 0 15px rgba(255,255,255,0.5), 0 0 35px rgba(92,52,34,0.9)',
         scale: 1.15,
         repeat: 1,
         yoyo: true,
         duration: 0.8,
         ease: 'power3.inOut',
      },
      '-=0.8',
   ); // 텍스트 응집이 끝나갈 무렵 시작

   // 4️⃣ 배경 & 프로필 등장 (더욱 극적으로)
   tl.to(
      '.hero-background',
      {
         duration: 3.5,
         opacity: 1,
         scale: 1,
         filter: 'blur(0px)',
         ease: 'slow(0.7, 0.7, false)', // GSAP의 SlowMo Easing으로 천천히 시작하고 끝나는 효과
      },
      '-=1.0',
   )

      .fromTo(
         '.hero-profile-image',
         {
            autoAlpha: 0,
            scale: 0.2,
            rotationY: -180, // 뒤집힌 상태에서 시작
            filter: 'brightness(3) blur(20px)', // 밝게 빛나며 블러 처리된 상태
         },
         {
            duration: 2.5,
            autoAlpha: 1,
            scale: 1,
            rotationY: 0,
            filter: 'brightness(1) blur(0px)',
            ease: 'expo.out',
         },
         '<+=1.0',
      ); // 배경이 나타나기 시작하고 1초 뒤에 등장

   // 5️⃣ 최종 텍스트 색상 정리
   tl.to(
      regularChars,
      {
         duration: 1.5,
         color: '#5c3422',
         ease: 'power2.inOut',
      },
      '-=2.0',
   );
}

// ... initializeApp 함수 안에서 animateHeroSection(); 호출은 그대로 유지 ...
// =============================================================================
// [4. 이벤트 핸들러 및 유틸리티 (Event Handlers & Utilities)]
// =============================================================================

async function handleLogin(email, password) {
   console.log('[Auth] 로그인 시도:', email);
   try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('[Auth] 로그인 성공.');
      alert('로그인 성공!');
      closeAdminModal();
   } catch (error) {
      console.error('[Auth] 로그인 실패:', error);
      alert('아이디 또는 비밀번호가 일치하지 않습니다.');
   }
}

async function handleLogout() {
   console.log('[Auth] 로그아웃 시도.');
   try {
      await signOut(auth);
      console.log('[Auth] 로그아웃 성공.');
      alert('로그아웃 되었습니다.');
   } catch (error) {
      console.error('[Auth] 로그아웃 실패:', error);
   }
}

function openModal(modalElement) {
   if (!modalElement) return;
   console.log(`[UI] 모달 열기: #${modalElement.id}`);
   document.body.classList.add('modal-open');
   const currentScrollY = AppState.scrollbar.offset.y;
   modalElement.style.top = `${currentScrollY}px`;
   modalElement.classList.add('visible');
}

function closeModal(modalElement) {
   if (!modalElement) return;
   console.log(`[UI] 모달 닫기: #${modalElement.id}`);
   document.body.classList.remove('modal-open');
   modalElement.classList.remove('visible');
}

function openAdminModal() {
   console.log('[Event] 관리자 모달 열기 버튼 클릭.');
   openModal(document.getElementById('admin-modal-wrapper'));
}

function closeAdminModal() {
   const modal = document.getElementById('admin-modal-wrapper');
   closeModal(modal);
   modal.querySelector('#admin-login-form')?.reset();
}

function openProjectFormModalForCreate() {
   console.log('[Event] 새 프로젝트 추가 모달 열기 버튼 클릭.');
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
   console.log(`[Event] 프로젝트 수정 모달 열기. 프로젝트 ID: ${project.id}`);
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

// ✅ [수정된 함수]
function setupScrollAnimations() {
   console.log('[Init] 스크롤 애니메이션 설정 (재실행 가능 모드).');
   const scrollElements = document.querySelectorAll('[data-animation]');
   if (!scrollElements.length) return;

   const observer = new IntersectionObserver(
      (entries) => {
         entries.forEach((entry) => {
            // isIntersecting이 true이면 (화면에 보이면)
            if (entry.isIntersecting) {
               entry.target.classList.add('is-visible');
            }
            // isIntersecting이 false이면 (화면 밖으로 나가면)
            else {
               entry.target.classList.remove('is-visible');
            }
         });
      },
      {
         threshold: 0.1, // 요소가 10% 이상 보일 때 반응
      },
   );

   scrollElements.forEach((el) => observer.observe(el));
}

function initializeContactSection() {
   console.log('[Init] Contact 섹션 초기화.');
   const emailBox = document.getElementById('email-box');
   const copyToast = document.getElementById('copy-toast');
   if (emailBox) {
      emailBox.addEventListener('click', () => {
         console.log('[Event] 이메일 주소 복사 클릭.');
         const email = emailBox.dataset.email;
         navigator.clipboard
            .writeText(email)
            .then(() => {
               copyToast.classList.add('show');
               setTimeout(() => {
                  copyToast.classList.remove('show');
               }, 2000);
            })
            .catch((err) => console.error('[Error] 이메일 복사 실패:', err));
      });
   }
}

const contactForm = document.getElementById('contact-form');
if (contactForm) {
   console.log('[Init] Contact Form 이벤트 리스너 설정.');
   contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('[Event] Contact Form 제출 이벤트 발생.');

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true; // 중복 제출 방지
      submitBtn.textContent = '전송 중...';

      const nameInput = document.getElementById('contact-name');
      const emailInput = document.getElementById('contact-email');
      const messageInput = document.getElementById('contact-message');

      const messageData = {
         name: nameInput.value,
         email: emailInput.value,
         message: messageInput.value,
         createdAt: new Date(), // 서버 타임스탬프로 변경하면 더 좋음
         read: false, // 관리자가 읽었는지 여부
      };

      console.log('[DB] Firestore에 저장할 메시지 데이터:', messageData);

      try {
         console.log("[DB] 'messages' 컬렉션에 데이터 추가 시도...");
         const messagesCollection = collection(db, 'messages');
         const docRef = await addDoc(messagesCollection, messageData);

         console.log(`[DB] 메시지 저장 성공! 문서 ID: ${docRef.id}`);
         alert(
            '메시지가 성공적으로 전송되었습니다. 빠른 시일 내에 회신 드리겠습니다.',
         );
         contactForm.reset();
         console.log('[UI] 폼 초기화 완료.');
      } catch (error) {
         console.error('[Error] 메시지 저장 실패:', error);
         alert('메시지 전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
         submitBtn.disabled = false;
         submitBtn.textContent = '메시지 전송';
         console.log('[UI] 제출 버튼 상태 복원.');
      }
   });
} else {
   console.warn('[Init] Contact Form (id="contact-form")을 찾을 수 없습니다.');
}

function initializeMap() {
   console.log('[Init] 지도 초기화.');
   if (typeof kakao === 'undefined' || !kakao.maps) {
      console.error('[Error] Kakao Maps SDK가 로드되지 않았습니다.');
      return;
   }
   const mapContainer = document.getElementById('map');
   if (!mapContainer) return;
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
      kakao.maps.event.addListener(marker, 'click', () =>
         infowindow.open(map, marker),
      );
   };
   createMarkerAndInfoWindow(
      seoulPosition,
      '수도권 어디든<br>성장할 준비가 되어있습니다!',
   );
   createMarkerAndInfoWindow(ilsanPosition, '유연한 근무가<br>가능합니다!');
}
// =============================================================================
// [5. 애플리케이션 초기화 (Application Initialization)]
// =============================================================================

function initializeApp() {
   console.log('[App] 애플리케이션 초기화 시작.');

   // --- 1. DOM 요소 캐싱 ---
   console.log('[Init] DOM 요소 캐싱...');
   const authBtn = document.getElementById('admin-auth-btn');
   const createProjectBtn = document.getElementById('create-project-btn');
   const deleteAllBtn = document.getElementById('delete-all-btn');
   const projectGrid = document.getElementById('project-grid');
   const adminModal = document.getElementById('admin-modal-wrapper');
   const loginForm = document.getElementById('admin-login-form');
   const filterButtons = document.querySelectorAll('.filter-btn');
   const projectFormEl = document.getElementById('project-form');
   const projectFormModal = document.getElementById('project-form-modal');
   const progressBar = document.querySelector('.progress-bar');
   const sections = document.querySelectorAll('section');
   const wavyText = document.querySelector('.wavy-text');
   quoteTextEl = document.querySelector('.quote-text');
   quoteAuthorEl = document.querySelector('.quote-author');
   quoteSourceEl = document.querySelector('.quote-source');

   const fabEmailBtn = document.getElementById('fab-email');
   const fabTopBtn = document.getElementById('fab-top');
   const fabCopyToast = document.getElementById('fab-copy-toast');

   // --- 2. 핵심 리스너 및 기능 초기화 ---
   console.log('[Init] 핵심 리스너 및 기능 초기화...');
   try {
      const scrollbar = Scrollbar.init(document.querySelector('.wrapper'), {
         damping: 0.07,
      });
      AppState.scrollbar = scrollbar;
      console.log('[Init] SmoothScrollbar 초기화 성공.');

      scrollbar.addListener((status) => {
         if (status.limit.y > 0) {
            const scrollPercentage = (status.offset.y / status.limit.y) * 100;
            progressBar.style.width = `${scrollPercentage}%`;

            let currentSection = sections[0];
            sections.forEach((section) => {
               if (section.offsetTop <= status.offset.y + 100) {
                  currentSection = section;
               }
            });
            progressBar.style.backgroundColor =
               currentSection.dataset.color || '#3498db';
         }
      });
   } catch (error) {
      console.error('[Error] SmoothScrollbar 초기화 실패:', error);
   }

   onAuthStateChanged(auth, (user) => {
      console.log('[Firebase] 인증 상태 변경 감지.');
      AppState.isLoggedIn = !!user;
      updateAuthUI();
   });

   onSnapshot(
      projectsCollection,
      (snapshot) => {
         console.log('[Firebase] Firestore 데이터 변경 감지 (onSnapshot).');
         AppState.projects = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
         }));
         filterAndRenderProjects();
      },
      (error) => {
         console.error('[Error] Firestore 데이터 수신 실패:', error);
         if (projectGrid) {
            projectGrid.innerHTML =
               '<p class="empty-message">프로젝트를 불러오는 데 실패했습니다.</p>';
         }
      },
   );

   // --- 3. 이벤트 리스너 바인딩 ---
   console.log('[Init] 이벤트 리스너 바인딩...');

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
         console.log('[Event] 전체 삭제 버튼 클릭.');
         if (
            confirm(
               '모든 프로젝트를 정말 삭제하시겠습니까? 되돌릴 수 없습니다!',
            )
         ) {
            console.log('[DB] 모든 프로젝트 삭제 실행.');
            AppState.projects.forEach((project) => {
               deleteDoc(doc(db, 'projects', project.id)).catch((error) =>
                  console.error(`[Error] ${project.id} 삭제 실패:`, error),
               );
            });
         }
      });
   }

   if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
         e.preventDefault();
         let username = document.getElementById('id').value;
         const password = document.getElementById('pw').value;
         if (!username.includes('@')) {
            username = `${username}@internal.use`;
         }
         handleLogin(username, password);
      });
   }

   if (projectGrid) {
      projectGrid.addEventListener('click', async (e) => {
         const target = e.target.closest('button');
         if (!target) return;

         const projectId = target.dataset.id;
         if (!projectId) return;

         if (target.classList.contains('edit-btn')) {
            const projectToEdit = AppState.projects.find(
               (p) => p.id === projectId,
            );
            if (projectToEdit) openProjectFormModalForEdit(projectToEdit);
         } else if (target.classList.contains('delete-btn')) {
            console.log(`[Event] 삭제 버튼 클릭. 프로젝트 ID: ${projectId}`);
            if (confirm('프로젝트를 정말 삭제하시겠습니까?')) {
               try {
                  console.log(`[DB] 프로젝트 삭제 실행: ${projectId}`);
                  await deleteDoc(doc(db, 'projects', projectId));
                  console.log(`[DB] 프로젝트 삭제 성공: ${projectId}`);
               } catch (error) {
                  console.error('[Error] 삭제 실패:', error);
                  alert('프로젝트 삭제에 실패했습니다.');
               }
            }
         }
      });
   }

   if (filterButtons) {
      filterButtons.forEach((button) => {
         button.addEventListener('click', (e) => {
            const newFilter = e.target.dataset.filter;
            console.log(`[Event] 필터 버튼 클릭: ${newFilter}`);
            if (AppState.currentFilter !== newFilter) {
               AppState.currentFilter = newFilter;
               filterButtons.forEach((btn) => btn.classList.remove('active'));
               e.target.classList.add('active');
               filterAndRenderProjects();
            }
         });
      });
   }

   if (projectFormEl) {
      projectFormEl.addEventListener('submit', async (e) => {
         e.preventDefault();
         console.log('[Event] 프로젝트 폼 제출.');
         if (!AppState.isLoggedIn) {
            alert('권한이 없습니다.');
            return;
         }
         const projectId = document.getElementById('project-id').value;
         const projectData = {
            title: document.getElementById('project-title').value,
            headline: document.getElementById('project-headline').value,
            imageSrc: document.getElementById('project-imageSrc').value,
            overview: document.getElementById('project-overview').value,
            techStack: document
               .getElementById('project-techStack')
               .value.split(',')
               .map((s) => s.trim())
               .filter(Boolean),
            category: document
               .getElementById('project-category')
               .value.split(',')
               .map((s) => s.trim())
               .filter(Boolean),
            links: {
               github: document.getElementById('project-github').value,
               site: document.getElementById('project-site').value,
            },
         };
         try {
            if (projectId) {
               console.log(`[DB] 프로젝트 업데이트 실행: ${projectId}`);
               await updateDoc(doc(db, 'projects', projectId), projectData);
               console.log(`[DB] 프로젝트 업데이트 성공.`);
               alert('프로젝트가 성공적으로 수정되었습니다.');
            } else {
               console.log(`[DB] 새 프로젝트 추가 실행.`);
               await addDoc(collection(db, 'projects'), projectData);
               console.log(`[DB] 새 프로젝트 추가 성공.`);
               alert('프로젝트가 성공적으로 추가되었습니다.');
            }
            closeProjectFormModal();
         } catch (error) {
            console.error('[Error] 데이터 저장 실패:', error);
            alert('데이터 저장에 실패했습니다.');
         }
      });
   }

   [adminModal, projectFormModal].forEach((modal) => {
      if (modal) {
         const closeFn =
            modal.id === 'admin-modal-wrapper'
               ? closeAdminModal
               : closeProjectFormModal;
         modal
            .querySelector('.modal-close-btn')
            ?.addEventListener('click', closeFn);
         modal.addEventListener('click', (e) => {
            if (e.target === modal) closeFn();
         });
      }
   });

   // --- 4. 초기 UI/기능 실행 ---
   console.log('[Init] 초기 UI/기능 실행...');
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
   // --- 5. 플로팅 액션 버튼(FAB) 초기화 ---
   console.log('[Init] 플로팅 액션 버튼 초기화...');

   // FAB 이메일 복사 버튼 이벤트
   if (fabEmailBtn) {
      fabEmailBtn.addEventListener('click', () => {
         const email = fabEmailBtn.dataset.email;
         navigator.clipboard
            .writeText(email)
            .then(() => {
               console.log('[Event] FAB 이메일 복사 성공.');
               fabCopyToast.classList.add('show');
               setTimeout(() => {
                  fabCopyToast.classList.remove('show');
               }, 2000);
            })
            .catch((err) =>
               console.error('[Error] FAB 이메일 복사 실패:', err),
            );
      });
   }

   // FAB 맨 위로 가기 버튼 이벤트
   if (fabTopBtn && AppState.scrollbar) {
      fabTopBtn.addEventListener('click', () => {
         console.log('[Event] FAB 맨 위로 가기 버튼 클릭.');
         AppState.scrollbar.scrollTo(0, 0, 1000);
      });

      // 스크롤에 따른 맨 위로 가기 버튼 표시/숨김
      AppState.scrollbar.addListener((status) => {
         if (status.offset.y > 1200) {
            fabTopBtn.classList.add('visible');
         } else {
            fabTopBtn.classList.remove('visible');
         }
      });
   }

   // --- 6. 동적 툴팁 초기화 ---
   console.log('[Init] 동적 툴팁 기능 초기화.');

   const tooltipElement = document.createElement('div');
   tooltipElement.className = 'dynamic-tooltip';
   document.body.appendChild(tooltipElement);

   const tooltipTriggers = document.querySelectorAll(
      '.nav-link-item a[data-tooltip]',
   );

   tooltipTriggers.forEach((trigger) => {
      trigger.addEventListener('mouseenter', () => {
         const tooltipText = trigger.getAttribute('data-tooltip');
         tooltipElement.textContent = tooltipText;

         const rect = trigger.getBoundingClientRect();

         const top = rect.bottom + 8;
         const left =
            rect.left + rect.width / 2 - tooltipElement.offsetWidth / 2;

         tooltipElement.style.top = `${top}px`;
         tooltipElement.style.left = `${left}px`;

         tooltipElement.classList.add('visible');
      });

      trigger.addEventListener('mouseleave', () => {
         tooltipElement.classList.remove('visible');
      });
   });
   initializeQuote();
   setInterval(showNextQuote, 3000);
   createSkillChart();
   animateHeroSection();
   let resizeTimer;
   window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
         console.log('[Event] 윈도우 리사이즈 완료, 차트 다시 그리기.');
         createSkillChart();
      }, 250);
   });

   setupScrollAnimations();
   initializeContactSection();

   if (typeof kakao !== 'undefined' && kakao.maps) {
      console.log('[Init] Kakao Maps SDK 로드 대기...');
      kakao.maps.load(() => initializeMap());
   }

   console.log('[App] 애플리케이션 초기화 완료.');
}

// [6. 앱 실행]
document.addEventListener('DOMContentLoaded', () => {
   console.log('[Event] DOMContentLoaded: 문서 로딩 완료.');
   initializeApp();
});
