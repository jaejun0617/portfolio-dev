/*
================================================================================
  [ 앱 아키텍처 (Firebase 연동) ]

  - Firebase Services: Firestore(DB), Authentication(인증)을 백엔드로 사용.
  - AppState (객체): 앱의 전역 상태를 관리하는 단일 소스. (Single Source of Truth)
  - UI Functions (함수 그룹): 상태(State)에 따라 DOM을 렌더링.
  - Event Handlers (함수 그룹): 사용자의 상호작용을 처리하고 Firebase와 통신.
  - Initialization (초기화 함수): 앱 시작 시 모든 기능을 조립하고 Firebase 리스너를 연결.
================================================================================
*/

// =============================================================================
// [1. Firebase SDK 및 외부 라이브러리 가져오기 및 초기화]
// =============================================================================

// Firebase SDK에서 필요한 함수들을 모듈 형태로 가져옵니다. (ESM 방식)
import { initializeApp as initializeFirebaseApp } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js';
import {
   getAuth, // 인증 서비스 총괄 객체를 가져오는 함수
   createUserWithEmailAndPassword, // 이메일/비밀번호로 신규 유저 생성
   signInWithEmailAndPassword, // 이메일/비밀번호로 로그인
   signOut, // 로그아웃
   onAuthStateChanged, // 사용자의 로그인 상태 변경을 실시간으로 감지하는 리스너
} from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js';
import {
   getFirestore, // Firestore 데이터베이스 서비스 총괄 객체를 가져오는 함수
   collection, // 특정 컬렉션에 대한 참조를 생성
   onSnapshot, // 컬렉션이나 문서의 변경사항을 실시간으로 수신
   addDoc, // 컬렉션에 새로운 문서를 추가 (ID는 자동 생성)
   doc, // 특정 문서에 대한 참조를 생성
   updateDoc, // 문서를 부분적으로 또는 전체적으로 업데이트
   deleteDoc, // 문서를 삭제
} from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js';
// GSAP(GreenSock Animation Platform) 라이브러리와 SplitText 플러그인을 가져옵니다. 복잡한 애니메이션을 구현하는 데 사용됩니다.
import { gsap } from 'https://cdn.skypack.dev/gsap';
import { SplitText } from 'https://cdn.skypack.dev/gsap/SplitText';

// [중요] Firebase 프로젝트와 웹 앱을 연결하기 위한 구성 정보 객체입니다.
// 이 값들은 Firebase 콘솔에서 '프로젝트 설정' > '내 앱' > 'SDK 설정 및 구성' 에서 확인할 수 있습니다.
const firebaseConfig = {
   apiKey: 'AIzaSyCZN2y1gIer8KWmi9q-Md-LOqn71c3G4m0',
   authDomain: 'my-portfoilo-2025.firebaseapp.com',
   projectId: 'my-portfoilo-2025',
   storageBucket: 'my-portfoilo-2025.appspot.com',
   messagingSenderId: '288065246579',
   appId: '1:288065246579:web:0e619cd72e5f505aede106',
   measurementId: 'G-ZHFL6XBQJ4',
};

// Firebase 앱 초기화: 위 `firebaseConfig`를 사용하여 Firebase 서비스를 초기화하고 앱 객체를 생성합니다.
console.log('[Firebase] 앱 초기화 시작...');
const app = initializeFirebaseApp(firebaseConfig);
// 인증 서비스 초기화 및 참조 가져오기
const auth = getAuth(app);
// Firestore 데이터베이스 서비스 초기화 및 참조 가져오기
const db = getFirestore(app);
// Firestore의 'projects' 컬렉션에 대한 참조를 생성합니다. 앞으로 이 참조를 통해 프로젝트 데이터를 읽고 씁니다.
const projectsCollection = collection(db, 'projects');
console.log('[Firebase] 앱 초기화 완료.');

// =============================================================================
// [2. 데이터 및 상태 관리 (Data & State Management)]
// =============================================================================

// 명언 섹션에 순환적으로 표시될 텍스트 데이터 배열
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
 * @description 앱의 전역 상태를 관리하는 중앙 객체입니다.
 * 이 객체의 값을 변경하면 앱의 여러 부분에 영향을 미칩니다. (Single Source of Truth)
 */
const AppState = {
   isLoggedIn: false, // 현재 사용자의 로그인 여부
   currentFilter: 'all', // 프로젝트 그리드의 현재 필터링 카테고리
   scrollbar: null, // SmoothScrollbar 인스턴스를 저장할 변수
   projects: [], // Firestore에서 불러온 프로젝트 데이터 배열
};

// =============================================================================
// [3. UI 렌더링 및 업데이트 (UI Rendering & Updates)]
// =============================================================================

/**
 * @description AppState.isLoggedIn 값에 따라 UI를 업데이트합니다.
 * '관리자/로그아웃' 버튼 텍스트를 변경하고, 관리자 전용 컨트롤 버튼(프로젝트 추가/삭제 등)을 표시하거나 숨깁니다.
 */
function updateAuthUI() {
   console.log('[UI] 인증 상태 UI 업데이트. 로그인 상태:', AppState.isLoggedIn);
   const authBtnText = document.getElementById('auth-btn-text');
   const adminControls = document.querySelector('.admin-controls');

   // 로그인 상태에 따라 버튼 텍스트 변경
   authBtnText.textContent = AppState.isLoggedIn ? '로그아웃' : '관리자';

   // 관리자 컨트롤 버튼 영역 표시/숨김 처리
   if (adminControls) {
      adminControls.style.display = AppState.isLoggedIn ? 'flex' : 'none';
   }
   // 로그인 상태가 변경되면 프로젝트 목록도 다시 렌더링하여 '수정/삭제' 버튼을 표시하거나 숨깁니다.
   filterAndRenderProjects();
}

/**
 * @description 주어진 프로젝트 데이터 배열을 기반으로 HTML을 동적으로 생성하여 화면에 렌더링합니다.
 * @param {Array} projectsToRender - 화면에 표시할 프로젝트 객체들의 배열
 */
function renderProjects(projectsToRender) {
   console.log(`[UI] 프로젝트 렌더링. ${projectsToRender.length}개 항목.`);
   const projectGrid = document.getElementById('project-grid');
   projectGrid.innerHTML = ''; // 기존 내용을 모두 지웁니다.

   // 렌더링할 프로젝트가 없는 경우 메시지를 표시합니다.
   if (!projectsToRender || projectsToRender.length === 0) {
      projectGrid.innerHTML =
         '<p class="empty-message">표시할 프로젝트가 없습니다. 관리자로 로그인하여 프로젝트를 추가해주세요.</p>';
      return;
   }

   // 각 프로젝트 데이터에 대해 HTML 요소를 생성합니다.
   projectsToRender.forEach((p, index) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'project-item';
      itemEl.setAttribute('data-animation', 'fade-in-up'); // 스크롤 애니메이션을 위한 속성
      itemEl.style.transitionDelay = `${index * 0.15}s`; // 순차적 애니메이션을 위한 딜레이

      // 로그인 상태일 때만 '수정', '삭제' 버튼을 포함시킵니다.
      const adminButtonsHTML = AppState.isLoggedIn
         ? `
           <div class="admin-actions">
               <button class="edit-btn" data-id="${p.id}">수정</button>
               <button class="delete-btn" data-id="${p.id}">삭제</button>
           </div>`
         : '';

      // 프로젝트 아이템의 전체 HTML 구조
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

   // 프로젝트 목록이 새로 렌더링되었으므로, 스크롤 애니메이션 설정을 다시 실행합니다.
   setupScrollAnimations();
}

/**
 * @description AppState에 저장된 전체 프로젝트 목록(AppState.projects)을
 * 현재 선택된 필터(AppState.currentFilter)에 맞게 필터링한 후, `renderProjects` 함수를 호출하여 화면에 표시합니다.
 */
function filterAndRenderProjects() {
   console.log(
      `[UI] 프로젝트 필터링 및 렌더링. 현재 필터: ${AppState.currentFilter}`,
   );
   const allProjects = AppState.projects;
   if (AppState.currentFilter === 'all') {
      // '전체' 필터일 경우 모든 프로젝트를 렌더링
      renderProjects(allProjects);
   } else {
      // 특정 카테고리 필터일 경우, 해당 카테고리를 포함하는 프로젝트만 필터링하여 렌더링
      const filtered = allProjects.filter((p) =>
         p.category.includes(AppState.currentFilter),
      );
      renderProjects(filtered);
   }
}

// 명언 표시 관련 DOM 요소와 상태 변수
let quoteTextEl, quoteAuthorEl, quoteSourceEl;
let currentQuoteIndex = 0;

/**
 * @description 명언 섹션을 초기화합니다. 첫 번째 명언을 화면에 표시합니다.
 */
function initializeQuote() {
   if (!quoteTextEl) return; // 관련 DOM 요소가 없으면 실행하지 않음
   const firstQuote = quotes[0];
   quoteTextEl.textContent = `"${firstQuote.text}"`;
   quoteAuthorEl.textContent = `- ${firstQuote.author}`;
   quoteSourceEl.textContent = firstQuote.source;
}

/**
 * @description 다음 명언을 페이드 아웃/인 효과와 함께 보여줍니다.
 */
function showNextQuote() {
   if (!quoteTextEl) return;
   quoteTextEl.classList.add('fading-out'); // CSS를 이용한 페이드 아웃 시작
   setTimeout(() => {
      // 0.5초 후 내용 변경 및 페이드 인
      currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length; // 인덱스를 순환시킴
      const nextQuote = quotes[currentQuoteIndex];
      quoteTextEl.textContent = `"${nextQuote.text}"`;
      quoteAuthorEl.textContent = `- ${nextQuote.author}`;
      quoteSourceEl.textContent = nextQuote.source;
      quoteTextEl.classList.remove('fading-out'); // 페이드 인
   }, 500); // 500ms는 CSS transition 시간과 일치해야 함
}

/**
 * @description Chart.js 라이브러리를 사용하여 기술 스택 막대 차트를 생성합니다.
 * 윈도우 크기에 따라 폰트 크기가 조절되는 반응형 차트입니다.
 */
function createSkillChart() {
   console.log('[UI] 기술 차트 생성.');
   const ctx = document.getElementById('skill-radar-chart');
   if (!ctx) return; // 차트를 그릴 캔버스 요소가 없으면 중단
   if (ctx.chart) {
      ctx.chart.destroy(); // 리사이즈 시 기존 차트가 있다면 파괴하고 새로 그림
   }

   // 화면 너비에 따라 동적으로 폰트 크기를 결정하는 함수
   const getResponsiveFontSize = () => {
      const screenWidth = window.innerWidth;
      if (screenWidth >= 1024) return 14;
      if (screenWidth >= 768) return 10;
      if (screenWidth >= 767) return 10;
      if (screenWidth >= 480) return 8;
      return 4;
   };

   // 차트에 표시될 데이터
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

   // 차트의 모양과 동작을 결정하는 옵션
   const chartOptions = {
      responsive: true, // 컨테이너 크기에 맞춰 자동으로 리사이즈
      maintainAspectRatio: false, // 컨테이너 비율을 유지하지 않고 꽉 채움
      scales: {
         x: {
            grid: { display: false }, // x축 그리드 라인 숨김
            ticks: { font: { size: getResponsiveFontSize(), weight: '500' } }, // x축 레이블 폰트 설정
         },
         y: { beginAtZero: true, max: 10, ticks: { stepSize: 1 } }, // y축 0에서 10까지 1단위로 표시
      },
      plugins: {
         legend: { display: false }, // 범례 숨김
         tooltip: {
            // 툴팁(마우스 올렸을 때 정보) 커스터마이징
            callbacks: {
               label: (context) => `숙련도: ${context.parsed.y} / 10 점`,
            },
         },
      },
   };

   // 새로운 차트 인스턴스를 생성하여 캔버스에 그립니다.
   ctx.chart = new Chart(ctx, {
      type: 'bar', // 차트 종류: 막대 차트
      data: skillData,
      options: chartOptions,
   });
}

/**
 * @description GSAP 라이브러리를 사용하여 Hero 섹션의 텍스트와 이미지에 대한 복잡한 등장 애니메이션을 실행합니다.
 */
function animateHeroSection() {
   console.log('[GSAP] Hero "Cosmic Genesis" Animation 시작');

   // GSAP 플러그인 등록
   gsap.registerPlugin(SplitText);

   // 애니메이션을 적용할 텍스트 라인을 SplitText를 사용하여 글자 단위로 분리
   const line1 = new SplitText('.line1', { type: 'chars' });
   const line2 = new SplitText('.line2', { type: 'chars' });
   const line3 = new SplitText('.line3', { type: 'chars' });
   const line4 = new SplitText('.line4', { type: 'chars' });
   const highlights = gsap.utils.toArray('.highlight'); // 강조 효과를 줄 글자들

   // 모든 글자들을 하나의 배열로 합침
   const allChars = [
      ...line1.chars,
      ...line2.chars,
      ...line3.chars,
      ...line4.chars,
   ];
   // 일반 글자들 (강조되지 않은)
   const regularChars = allChars.filter(
      (char) => !char.parentElement.classList.contains('highlight'),
   );

   // 애니메이션의 순서를 제어하는 타임라인 생성
   const tl = gsap.timeline();
   const isMobile = window.innerWidth <= 768; // 모바일 여부 확인

   // 1️⃣ [초기 상태 설정] 애니메이션 시작 전 요소들의 상태를 정의합니다.
   gsap.set(highlights, { color: '#000000', autoAlpha: 1 });
   gsap.set(regularChars, { color: '#ffffff', autoAlpha: 1 });
   gsap.set('.hero-profile-image', { autoAlpha: 0 }); // 프로필 이미지는 처음엔 투명

   // 2️⃣ [글자 등장 애니메이션] 모든 글자들이 무작위 위치에서 원래 자리로 모이는 효과
   tl.from(allChars, {
      duration: isMobile ? 2.0 : 2.5, // 모바일에서 더 빠르게
      // x, y, z 좌표를 무작위로 설정하여 3D 공간에서 흩어지게 함
      x: () => gsap.utils.random(-300, 300, 5),
      y: () => gsap.utils.random(-400, 400, 5),
      z: () => gsap.utils.random(-1000, 1000, 10),
      // 회전 및 크기 값도 무작위로 설정
      rotationX: () => gsap.utils.random(-720, 720),
      rotationY: () => gsap.utils.random(-720, 720),
      scale: () => gsap.utils.random(0.1, 0.5),
      // 투명도와 블러 효과
      opacity: 0,
      filter: 'blur(15px)',
      // 애니메이션의 가속/감속 효과 (ease)
      ease: 'expo.inOut',
      // 글자들이 순차적으로 나타나는 효과 (stagger)
      stagger: {
         each: 0.02,
         from: 'random', // 무작위 순서로
      },
   });

   // 3️⃣ [하이라이트 효과] 특정 글자들에 강조 효과를 줍니다.
   tl.to(
      highlights,
      {
         color: '#000000',
         textShadow:
            '0 0 15px rgba(255,255,255,0.5), 0 0 35px rgba(92,52,34,0.9)', // 텍스트 그림자 효과
         scale: 1.15, // 약간 확대
         repeat: 1, // 1번 반복 (총 2회 실행)
         yoyo: true, // 원래 상태로 되돌아옴
         duration: 0.8,
         ease: 'power3.inOut',
         // 애니메이션 시작 시점에 그라데이션 배경을 적용하여 특별한 색상 효과를 줌
         onStart: () => {
            highlights.forEach((el) => {
               el.style.backgroundImage =
                  'linear-gradient(to top, rgba(92, 52, 34, 0.1) 80%, transparent 50%)';
               el.style.webkitBackgroundClip = 'text';
               el.style.webkitTextFillColor = 'transparent';
            });
         },
         // 애니메이션 완료 후 스타일을 원래대로 복구하여 최종 색상이 적용되게 함
         onComplete: () => {
            highlights.forEach((el) => {
               el.style.backgroundImage =
                  'linear-gradient(to top, rgba(212, 187, 172, 0.4) , transparent 70%)';
               el.style.webkitBackgroundClip = '';
               el.style.webkitTextFillColor = '#5c3422'; // 최종 색상
            });
         },
      },
      '-=0.8', // 이전 애니메이션이 끝나기 0.8초 전에 시작
   );

   // 4️⃣ [배경 & 프로필 이미지 등장]
   tl.to(
      '.hero-background',
      {
         duration: 3.5,
         opacity: 1, // 배경 투명도 조절
         scale: 1,
         filter: 'blur(0px)', // 배경 블러 제거
         ease: 'slow(0.7, 0.7, false)',
      },
      '-=1.0',
   ).fromTo(
      '.hero-profile-image', // 프로필 이미지
      {
         // 시작 상태
         autoAlpha: 0,
         scale: 0.2,
         rotationY: -180,
         filter: 'brightness(3) blur(20px)',
      },
      {
         // 종료 상태
         duration: 2.5,
         autoAlpha: 1,
         scale: 1,
         rotationY: 0,
         filter: 'brightness(1) blur(0px)',
         ease: 'expo.out',
      },
      '<+=1.0', // 이전 애니메이션 시작 후 1초 뒤에 시작
   );

   // 5️⃣ [최종 텍스트 색상 정리] 일반 텍스트의 색상을 최종 색상으로 변경
   tl.to(
      regularChars,
      {
         scale: 0.8,
         duration: 1,
         color: '#98755b',
         ease: 'power2.inOut',
      },
      '-=2.0',
   );
}

// =============================================================================
// [4. 이벤트 핸들러 및 유틸리티 (Event Handlers & Utilities)]
// =============================================================================

/**
 * @description Firebase Authentication을 사용하여 이메일과 비밀번호로 로그인을 시도합니다.
 * @param {string} email - 사용자 이메일
 * @param {string} password - 사용자 비밀번호
 */
async function handleLogin(email, password) {
   console.log('[Auth] 로그인 시도:', email);
   try {
      await signInWithEmailAndPassword(auth, email, password); // Firebase 로그인 함수 호출
      console.log('[Auth] 로그인 성공.');
      alert('로그인 성공!');
      closeAdminModal(); // 로그인 성공 시 관리자 모달 닫기
   } catch (error) {
      console.error('[Auth] 로그인 실패:', error);
      alert('아이디 또는 비밀번호가 일치하지 않습니다.');
   }
}

/**
 * @description Firebase Authentication을 사용하여 현재 로그인된 사용자를 로그아웃시킵니다.
 */
async function handleLogout() {
   console.log('[Auth] 로그아웃 시도.');
   try {
      await signOut(auth); // Firebase 로그아웃 함수 호출
      console.log('[Auth] 로그아웃 성공.');
      alert('로그아웃 되었습니다.');
   } catch (error) {
      console.error('[Auth] 로그아웃 실패:', error);
   }
}

/**
 * @description 특정 모달 창을 여는 범용 함수입니다.
 * @param {HTMLElement} modalElement - 열고자 하는 모달의 DOM 요소
 */
function openModal(modalElement) {
   if (!modalElement) return;
   console.log(`[UI] 모달 열기: #${modalElement.id}`);
   document.body.classList.add('modal-open'); // 배경 스크롤 방지
   const currentScrollY = AppState.scrollbar.offset.y; // 현재 스크롤 위치 계산
   modalElement.style.top = `${currentScrollY}px`; // 모달 위치를 현재 뷰포트에 맞춤
   modalElement.classList.add('visible'); // 모달을 보이게 하는 클래스 추가
}

/**
 * @description 특정 모달 창을 닫는 범용 함수입니다.
 * @param {HTMLElement} modalElement - 닫고자 하는 모달의 DOM 요소
 */
function closeModal(modalElement) {
   if (!modalElement) return;
   console.log(`[UI] 모달 닫기: #${modalElement.id}`);
   document.body.classList.remove('modal-open'); // 배경 스크롤 방지 해제
   modalElement.classList.remove('visible'); // 모달을 숨기는 클래스 제거
}

/**
 * @description 관리자 로그인 모달을 엽니다.
 */
function openAdminModal() {
   console.log('[Event] 관리자 모달 열기 버튼 클릭.');
   openModal(document.getElementById('admin-modal-wrapper'));
}

/**
 * @description 관리자 로그인 모달을 닫고, 입력 폼을 초기화합니다.
 */
function closeAdminModal() {
   const modal = document.getElementById('admin-modal-wrapper');
   closeModal(modal);
   modal.querySelector('#admin-login-form')?.reset(); // 폼 필드 초기화
}

/**
 * @description '새 프로젝트 추가'를 위한 프로젝트 폼 모달을 엽니다.
 * 로그인 상태가 아니면 경고창을 표시하고, 폼을 비운 상태로 엽니다.
 */
function openProjectFormModalForCreate() {
   console.log('[Event] 새 프로젝트 추가 모달 열기 버튼 클릭.');
   if (!AppState.isLoggedIn) {
      alert('관리자 로그인이 필요한 기능입니다.');
      return;
   }
   const modal = document.getElementById('project-form-modal');
   modal.querySelector('#project-form-title').textContent = '새 프로젝트 추가';
   modal.querySelector('#project-form').reset(); // 폼 초기화
   modal.querySelector('#project-id').value = ''; // id 필드는 비워둠 (새 프로젝트이므로)
   openModal(modal);
}

/**
 * @description 기존 프로젝트 '수정'을 위한 프로젝트 폼 모달을 엽니다.
 * 전달받은 프로젝트 데이터로 폼 필드를 미리 채워놓습니다.
 * @param {object} project - 수정할 프로젝트의 데이터 객체
 */
function openProjectFormModalForEdit(project) {
   console.log(`[Event] 프로젝트 수정 모달 열기. 프로젝트 ID: ${project.id}`);
   if (!AppState.isLoggedIn) {
      alert('관리자 로그인이 필요한 기능입니다.');
      return;
   }
   const modal = document.getElementById('project-form-modal');
   modal.querySelector('#project-form-title').textContent = '프로젝트 수정';
   // 폼 필드에 기존 데이터 채우기
   modal.querySelector('#project-id').value = project.id;
   modal.querySelector('#project-title').value = project.title;
   modal.querySelector('#project-headline').value = project.headline;
   modal.querySelector('#project-imageSrc').value = project.imageSrc;
   modal.querySelector('#project-overview').value = project.overview;
   modal.querySelector('#project-techStack').value =
      project.techStack.join(', '); // 배열을 콤마로 구분된 문자열로 변환
   modal.querySelector('#project-category').value = project.category.join(', ');
   modal.querySelector('#project-github').value = project.links.github;
   modal.querySelector('#project-site').value = project.links.site;
   openModal(modal);
}

/**
 * @description 프로젝트 폼 모달을 닫고, 입력 폼을 초기화합니다.
 */
function closeProjectFormModal() {
   const modal = document.getElementById('project-form-modal');
   closeModal(modal);
   modal.querySelector('#project-form')?.reset(); // 폼 필드 초기화
}

/**
 * @description `IntersectionObserver` API를 사용하여 스크롤 시 요소가 화면에 나타나거나 사라질 때 애니메이션을 트리거합니다.
 * 이 함수는 프로젝트 목록이 업데이트될 때마다 호출될 수 있도록 독립적으로 만들어졌습니다.
 */
function setupScrollAnimations() {
   console.log('[Init] 스크롤 애니메이션 설정 (재실행 가능 모드).');
   const scrollElements = document.querySelectorAll('[data-animation]');
   if (!scrollElements.length) return;

   // IntersectionObserver 인스턴스 생성
   const observer = new IntersectionObserver(
      (entries) => {
         entries.forEach((entry) => {
            // isIntersecting이 true이면 (요소가 뷰포트에 들어오면)
            if (entry.isIntersecting) {
               entry.target.classList.add('is-visible');
            }
            // isIntersecting이 false이면 (요소가 뷰포트에서 나가면)
            else {
               entry.target.classList.remove('is-visible'); // 다시 스크롤했을 때 애니메이션이 재실행되도록 클래스 제거
            }
         });
      },
      {
         threshold: 0.1, // 요소가 10% 이상 보일 때 콜백 함수 실행
      },
   );

   // 각 대상 요소에 대해 관찰 시작
   scrollElements.forEach((el) => observer.observe(el));
}

/**
 * @description Contact 섹션의 이메일 복사 기능을 초기화합니다.
 */
function initializeContactSection() {
   console.log('[Init] Contact 섹션 초기화.');
   const emailBox = document.getElementById('email-box');
   const copyToast = document.getElementById('copy-toast');
   if (emailBox) {
      emailBox.addEventListener('click', () => {
         console.log('[Event] 이메일 주소 복사 클릭.');
         const email = emailBox.dataset.email;
         // 클립보드에 이메일 주소 복사
         navigator.clipboard
            .writeText(email)
            .then(() => {
               // 성공 시 토스트 메시지 표시
               copyToast.classList.add('show');
               setTimeout(() => {
                  copyToast.classList.remove('show');
               }, 2000); // 2초 후 사라짐
            })
            .catch((err) => console.error('[Error] 이메일 복사 실패:', err));
      });
   }
}

// Contact Form(문의하기 폼) 요소를 찾아서 submit 이벤트 리스너를 추가합니다.
const contactForm = document.getElementById('contact-form');
if (contactForm) {
   console.log('[Init] Contact Form 이벤트 리스너 설정.');
   contactForm.addEventListener('submit', async (e) => {
      e.preventDefault(); // 폼의 기본 제출 동작(페이지 새로고침)을 막음
      console.log('[Event] Contact Form 제출 이벤트 발생.');

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true; // 중복 제출 방지를 위해 버튼 비활성화
      submitBtn.textContent = '전송 중...';

      // 폼 입력 값 가져오기
      const nameInput = document.getElementById('contact-name');
      const emailInput = document.getElementById('contact-email');
      const messageInput = document.getElementById('contact-message');

      // Firestore에 저장할 데이터 객체 생성
      const messageData = {
         name: nameInput.value,
         email: emailInput.value,
         message: messageInput.value,
         createdAt: new Date(), // 메시지 생성 시간 기록
         read: false, // 관리자가 읽었는지 여부 플래그
      };

      console.log('[DB] Firestore에 저장할 메시지 데이터:', messageData);

      try {
         console.log("[DB] 'messages' 컬렉션에 데이터 추가 시도...");
         const messagesCollection = collection(db, 'messages'); // 'messages' 컬렉션 참조
         const docRef = await addDoc(messagesCollection, messageData); // 데이터 추가

         console.log(`[DB] 메시지 저장 성공! 문서 ID: ${docRef.id}`);
         alert(
            '메시지가 성공적으로 전송되었습니다. 빠른 시일 내에 회신 드리겠습니다.',
         );
         contactForm.reset(); // 폼 초기화
         console.log('[UI] 폼 초기화 완료.');
      } catch (error) {
         console.error('[Error] 메시지 저장 실패:', error);
         alert('메시지 전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
         // 성공/실패 여부와 관계없이 버튼 상태를 원래대로 복원
         submitBtn.disabled = false;
         submitBtn.textContent = '메시지 전송';
         console.log('[UI] 제출 버튼 상태 복원.');
      }
   });
} else {
   console.warn('[Init] Contact Form (id="contact-form")을 찾을 수 없습니다.');
}

/**
 * @description Kakao Maps API를 사용하여 지도를 초기화하고 마커를 표시합니다.
 */
function initializeMap() {
   console.log('[Init] 지도 초기화.');
   // Kakao Maps SDK가 로드되었는지 확인
   if (typeof kakao === 'undefined' || !kakao.maps) {
      console.error('[Error] Kakao Maps SDK가 로드되지 않았습니다.');
      return;
   }
   const mapContainer = document.getElementById('map');
   if (!mapContainer) return;

   // 지도에 표시할 위치(위도, 경도) 설정
   const ilsanPosition = new kakao.maps.LatLng(37.663, 126.766);
   const seoulPosition = new kakao.maps.LatLng(37.5665, 126.978);
   // 두 지점의 중간을 지도의 중심으로 설정
   const centerLat = (ilsanPosition.getLat() + seoulPosition.getLat()) / 2;
   const centerLng = (ilsanPosition.getLng() + seoulPosition.getLng()) / 2;
   const mapOption = {
      center: new kakao.maps.LatLng(centerLat, centerLng),
      level: 10, // 지도 확대 레벨
   };
   const map = new kakao.maps.Map(mapContainer, mapOption);

   // 마커와 정보창(인포윈도우)을 생성하는 헬퍼 함수
   const createMarkerAndInfoWindow = (position, message) => {
      const marker = new kakao.maps.Marker({ position });
      marker.setMap(map);
      const infowindow = new kakao.maps.InfoWindow({
         content: `<div style="padding:5px; font-size:14px; text-align:center;">${message}</div>`,
         removable: true,
      });
      // 마커를 클릭하면 정보창이 열리도록 이벤트 리스너 추가
      kakao.maps.event.addListener(marker, 'click', () =>
         infowindow.open(map, marker),
      );
   };

   // 각 위치에 마커와 정보창 생성
   createMarkerAndInfoWindow(
      seoulPosition,
      '수도권 어디든<br>성장할 준비가 되어있습니다!',
   );
   createMarkerAndInfoWindow(ilsanPosition, '유연한 근무가<br>가능합니다!');
}

// =============================================================================
// [5. 애플리케이션 초기화 (Application Initialization)]
// =============================================================================

/**
 * @description 웹 페이지의 모든 기능과 이벤트 리스너를 설정하고 초기화하는 메인 함수입니다.
 */
function initializeApp() {
   console.log('[App] 애플리케이션 초기화 시작.');

   // --- 1. DOM 요소 캐싱 ---
   // 자주 사용하는 DOM 요소들을 변수에 미리 할당하여 성능을 향상시킵니다.
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
      // SmoothScrollbar 라이브러리를 초기화하여 부드러운 스크롤 효과를 적용합니다.
      const scrollbar = Scrollbar.init(document.querySelector('.wrapper'), {
         damping: 0.07, // 스크롤 감쇠 효과 (값이 작을수록 부드러움)
      });
      AppState.scrollbar = scrollbar; // 전역 상태에 스크롤바 인스턴스 저장
      console.log('[Init] SmoothScrollbar 초기화 성공.');

      // 스크롤 이벤트 리스너 추가 (프로그레스 바 업데이트)
      scrollbar.addListener((status) => {
         if (status.limit.y > 0) {
            // 전체 스크롤 가능 높이 대비 현재 스크롤 위치를 백분율로 계산
            const scrollPercentage = (status.offset.y / status.limit.y) * 100;
            progressBar.style.width = `${scrollPercentage}%`;

            // 현재 화면에 보이는 섹션을 감지하여 프로그레스 바 색상 변경
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

   // Firebase 인증 상태 변경 리스너: 로그인/로그아웃 시 자동으로 호출됩니다.
   onAuthStateChanged(auth, (user) => {
      console.log('[Firebase] 인증 상태 변경 감지.');
      AppState.isLoggedIn = !!user; // user 객체가 있으면 true, 없으면 false
      updateAuthUI(); // UI 업데이트 함수 호출
   });

   // Firestore 'projects' 컬렉션 실시간 리스너: 데이터가 변경될 때마다 자동으로 호출됩니다.
   onSnapshot(
      projectsCollection,
      (snapshot) => {
         console.log('[Firebase] Firestore 데이터 변경 감지 (onSnapshot).');
         // 변경된 데이터를 가져와 AppState.projects 배열을 업데이트합니다.
         AppState.projects = snapshot.docs.map((doc) => ({
            id: doc.id, // 문서의 고유 ID
            ...doc.data(), // 문서의 데이터
         }));
         filterAndRenderProjects(); // 데이터가 변경되었으니 화면을 다시 그립니다.
      },
      (error) => {
         // 데이터 수신에 실패한 경우 에러 처리
         console.error('[Error] Firestore 데이터 수신 실패:', error);
         if (projectGrid) {
            projectGrid.innerHTML =
               '<p class="empty-message">프로젝트를 불러오는 데 실패했습니다.</p>';
         }
      },
   );

   // --- 3. 이벤트 리스너 바인딩 ---
   console.log('[Init] 이벤트 리스너 바인딩...');

   // '관리자/로그아웃' 버튼 클릭 이벤트
   if (authBtn) {
      authBtn.addEventListener('click', () => {
         if (AppState.isLoggedIn) {
            if (confirm('로그아웃 하시겠습니까?')) handleLogout();
         } else {
            openAdminModal();
         }
      });
   }

   // '프로젝트 추가' 버튼 클릭 이벤트
   if (createProjectBtn) {
      createProjectBtn.addEventListener('click', openProjectFormModalForCreate);
   }

   // '전체 삭제' 버튼 클릭 이벤트
   if (deleteAllBtn) {
      deleteAllBtn.addEventListener('click', () => {
         console.log('[Event] 전체 삭제 버튼 클릭.');
         if (
            confirm(
               '모든 프로젝트를 정말 삭제하시겠습니까? 되돌릴 수 없습니다!',
            )
         ) {
            console.log('[DB] 모든 프로젝트 삭제 실행.');
            // AppState에 저장된 모든 프로젝트에 대해 삭제 요청을 보냅니다.
            AppState.projects.forEach((project) => {
               deleteDoc(doc(db, 'projects', project.id)).catch((error) =>
                  console.error(`[Error] ${project.id} 삭제 실패:`, error),
               );
            });
         }
      });
   }

   // 관리자 로그인 폼 제출(submit) 이벤트
   if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
         e.preventDefault(); // 기본 제출 동작 방지
         let username = document.getElementById('id').value;
         const password = document.getElementById('pw').value;
         // 편의를 위해 아이디에 '@'가 없으면 자동으로 접미사를 붙여줌
         if (!username.includes('@')) {
            username = `${username}@internal.use`;
         }
         handleLogin(username, password);
      });
   }

   // 프로젝트 그리드 내의 버튼 클릭 이벤트 (이벤트 위임)
   if (projectGrid) {
      projectGrid.addEventListener('click', async (e) => {
         const target = e.target.closest('button'); // 클릭된 요소가 버튼이거나 버튼의 자식인지 확인
         if (!target) return; // 버튼이 아니면 무시

         const projectId = target.dataset.id; // 버튼에 저장된 프로젝트 ID 가져오기
         if (!projectId) return;

         if (target.classList.contains('edit-btn')) {
            // '수정' 버튼일 경우
            const projectToEdit = AppState.projects.find(
               (p) => p.id === projectId,
            );
            if (projectToEdit) openProjectFormModalForEdit(projectToEdit);
         } else if (target.classList.contains('delete-btn')) {
            // '삭제' 버튼일 경우
            console.log(`[Event] 삭제 버튼 클릭. 프로젝트 ID: ${projectId}`);
            if (confirm('프로젝트를 정말 삭제하시겠습니까?')) {
               try {
                  console.log(`[DB] 프로젝트 삭제 실행: ${projectId}`);
                  await deleteDoc(doc(db, 'projects', projectId)); // Firestore에서 해당 문서 삭제
                  console.log(`[DB] 프로젝트 삭제 성공: ${projectId}`);
               } catch (error) {
                  console.error('[Error] 삭제 실패:', error);
                  alert('프로젝트 삭제에 실패했습니다.');
               }
            }
         }
      });
   }

   // 필터 버튼 클릭 이벤트
   if (filterButtons) {
      filterButtons.forEach((button) => {
         button.addEventListener('click', (e) => {
            const newFilter = e.target.dataset.filter;
            console.log(`[Event] 필터 버튼 클릭: ${newFilter}`);
            if (AppState.currentFilter !== newFilter) {
               AppState.currentFilter = newFilter; // 전역 상태 업데이트
               filterButtons.forEach((btn) => btn.classList.remove('active')); // 모든 버튼에서 'active' 클래스 제거
               e.target.classList.add('active'); // 클릭된 버튼에 'active' 클래스 추가
               filterAndRenderProjects(); // 필터링 및 렌더링 다시 실행
            }
         });
      });
   }

   // 프로젝트 추가/수정 폼 제출(submit) 이벤트
   if (projectFormEl) {
      projectFormEl.addEventListener('submit', async (e) => {
         e.preventDefault();
         console.log('[Event] 프로젝트 폼 제출.');
         if (!AppState.isLoggedIn) {
            alert('권한이 없습니다.');
            return;
         }
         const projectId = document.getElementById('project-id').value;

         // 폼에서 입력된 값들을 가져와 데이터 객체로 만듭니다.
         const projectData = {
            title: document.getElementById('project-title').value,
            headline: document.getElementById('project-headline').value,
            imageSrc: document.getElementById('project-imageSrc').value,
            overview: document.getElementById('project-overview').value,
            techStack: document
               .getElementById('project-techStack')
               .value.split(',') // 콤마로 구분된 문자열을
               .map((s) => s.trim()) // 공백 제거 후
               .filter(Boolean), // 빈 항목 제거하여 배열로 만듦
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
               // projectId가 있으면 '수정' 모드
               console.log(`[DB] 프로젝트 업데이트 실행: ${projectId}`);
               await updateDoc(doc(db, 'projects', projectId), projectData);
               console.log(`[DB] 프로젝트 업데이트 성공.`);
               alert('프로젝트가 성공적으로 수정되었습니다.');
            } else {
               // projectId가 없으면 '추가' 모드
               console.log(`[DB] 새 프로젝트 추가 실행.`);
               await addDoc(collection(db, 'projects'), projectData);
               console.log(`[DB] 새 프로젝트 추가 성공.`);
               alert('프로젝트가 성공적으로 추가되었습니다.');
            }
            closeProjectFormModal(); // 성공 시 폼 모달 닫기
         } catch (error) {
            console.error('[Error] 데이터 저장 실패:', error);
            alert('데이터 저장에 실패했습니다.');
         }
      });
   }

   // 모달 창 닫기 이벤트 (닫기 버튼, 배경 클릭)
   [adminModal, projectFormModal].forEach((modal) => {
      if (modal) {
         const closeFn =
            modal.id === 'admin-modal-wrapper'
               ? closeAdminModal
               : closeProjectFormModal;
         modal
            .querySelector('.modal-close-btn')
            ?.addEventListener('click', closeFn); // 닫기 버튼(X) 클릭
         modal.addEventListener('click', (e) => {
            if (e.target === modal) closeFn(); // 모달 배경 클릭
         });
      }
   });

   // --- 4. 초기 UI/기능 실행 ---
   console.log('[Init] 초기 UI/기능 실행...');

   // 물결 텍스트 애니메이션을 위한 span 태그 동적 생성
   if (wavyText) {
      const text = wavyText.textContent.trim();
      wavyText.innerHTML = '';
      text.split('').forEach((char, index) => {
         const span = document.createElement('span');
         span.textContent = char;
         span.style.setProperty('--i', index); // CSS 애니메이션 딜레이를 위한 인덱스 변수
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

   // FAB '맨 위로 가기' 버튼 이벤트
   if (fabTopBtn && AppState.scrollbar) {
      fabTopBtn.addEventListener('click', () => {
         console.log('[Event] FAB 맨 위로 가기 버튼 클릭.');
         AppState.scrollbar.scrollTo(0, 0, 1000); // 1초 동안 부드럽게 최상단으로 스크롤
      });

      // 스크롤 위치에 따라 '맨 위로 가기' 버튼 표시/숨김
      AppState.scrollbar.addListener((status) => {
         if (status.offset.y > 1200) {
            fabTopBtn.classList.add('visible');
         } else {
            fabTopBtn.classList.remove('visible');
         }
      });
   }

   // --- 6. 동적 툴팁 초기화 (수정된 버전) ---
   console.log('[Init] 동적 툴팁 기능 초기화.');

   // 툴팁을 표시할 단일 DOM 요소를 생성하여 body에 추가합니다.
   const tooltipElement = document.createElement('div');
   tooltipElement.className = 'dynamic-tooltip';
   document.body.appendChild(tooltipElement);

   // `data-tooltip` 속성을 가진 모든 요소를 찾습니다.
   const tooltipTriggers = document.querySelectorAll(
      '.nav-link-item a[data-tooltip]',
   );

   // 툴팁 타이머를 관리하기 위한 변수
   let tooltipTimer;

   /**
    * 툴팁을 보여주는 함수
    * @param {HTMLElement} trigger - 툴팁을 활성화시킨 요소 (<a> 태그)
    */
   function showTooltip(trigger) {
      // 이전에 실행되던 숨김 타이머가 있다면 취소합니다.
      clearTimeout(tooltipTimer);

      const tooltipText = trigger.getAttribute('data-tooltip');
      tooltipElement.textContent = tooltipText;

      const rect = trigger.getBoundingClientRect(); // 요소의 위치와 크기 정보

      // 툴팁 위치 계산
      // getBoundingClientRect()는 뷰포트 기준이므로 스크롤 위치와 무관하게 정확합니다.
      const top = rect.bottom + 8; // 요소의 바로 아래 + 8px 간격
      const left = rect.left + rect.width / 2 - tooltipElement.offsetWidth / 2;

      tooltipElement.style.top = `${top}px`;
      tooltipElement.style.left = `${left}px`;

      tooltipElement.classList.add('visible');

      tooltipTimer = setTimeout(() => {
         tooltipElement.classList.remove('visible');
      }, 1200);
   }

   /**
    * 툴팁을 즉시 숨기는 함수
    */
   function hideTooltip() {
      clearTimeout(tooltipTimer);
      tooltipElement.classList.remove('visible');
   }

   tooltipTriggers.forEach((trigger) => {
      trigger.addEventListener('mouseenter', () => {
         showTooltip(trigger);
      });

      trigger.addEventListener('mouseleave', () => {
         hideTooltip();
      });

      trigger.addEventListener('click', (e) => {
         e.preventDefault();
         showTooltip(trigger);
      });
   });

   // 페이지 로드 시 즉시 실행되어야 하는 함수들 호출
   initializeQuote(); // 명언 초기화
   setInterval(showNextQuote, 3000); // 3초마다 명언 변경
   createSkillChart(); // 기술 차트 생성
   animateHeroSection(); // Hero 섹션 애니메이션 시작

   // 창 크기 변경 시 차트를 다시 그리도록 설정 (디바운싱 적용)
   let resizeTimer;
   window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
         console.log('[Event] 윈도우 리사이즈 완료, 차트 다시 그리기.');
         createSkillChart();
      }, 250); // 리사이즈가 멈춘 후 250ms 뒤에 실행
   });

   setupScrollAnimations(); // 스크롤 애니메이션 초기화
   initializeContactSection(); // Contact 섹션 기능 초기화

   // Kakao Maps SDK가 로드된 후 지도를 초기화하도록 설정
   if (typeof kakao !== 'undefined' && kakao.maps) {
      console.log('[Init] Kakao Maps SDK 로드 대기...');
      kakao.maps.load(() => initializeMap());
   }

   console.log('[App] 애플리케이션 초기화 완료.');
}

// =============================================================================
// [6. 앱 실행]
// =============================================================================

// HTML 문서의 모든 요소가 로드되고 파싱된 후에 `initializeApp` 함수를 실행합니다.
document.addEventListener('DOMContentLoaded', () => {
   console.log('[Event] DOMContentLoaded: 문서 로딩 완료.');
   initializeApp();
});
