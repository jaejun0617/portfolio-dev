# ✨ 인터랙티브 포트폴리오 웹사이트 (Firebase 연동)

**🗓️ 프로젝트 기간**

2025년 9월 4일 ~ 9월 17일 (2주)

**📝 프로젝트 개요**

정적인 정보 나열 방식의 한계를 넘어, **Firebase를 클라우드 백엔드로 활용**하여 **실시간 데이터 관리(CRUD)와 안전한 사용자 인증 시스템을 구현**한 '살아있는' 포트폴리오 웹 애플리케이션입니다.

Vanilla JS만으로 **상태 기반의 동적 렌더링 아키텍처**를 직접 설계하고, **GSAP, Chart.js, Kakao Maps API**와 같은 전문 라이브러리를 프로젝트 목적에 맞게 통합하는 실무적인 경험을 통해, 단순한 코딩 능력을 넘어 **웹의 근본 원리를 깊이 이해하고 응용하는 프론트엔드 개발자로서의 역량을 증명**하는 것을 목표로 합니다.

---

**🧠 기획 의도 / 구조 설계 방향**

- **'전시관'이 아닌 '애플리케이션'**: 방문자는 데이터를 탐색하고 문의를 남길 수 있으며, 관리자는 어디서든 로그인하여 프로젝트를 실시간으로 CRUD 할 수 있는 동적인 경험 제공.
- **클라우드 기반 데이터 관리**: localStorage의 한계를 넘어, **Firebase Firestore(NoSQL DB)**를 데이터베이스로 사용하여 데이터의 영속성과 확장성을 확보.
- **보안이 강화된 인증**: JavaScript 소스 코드에 민감 정보를 노출하는 대신, **Firebase Authentication**을 통해 안전한 이메일/비밀번호 기반의 관리자 인증 시스템 구축.
- **Vanilla JS 역량 극대화**: 순수 JS의 힘만으로 외부 서비스(Firebase) 및 라이브러리와 비동기 통신하고, 반환된 데이터를 동적으로 렌더링하여 기본기의 탄탄함을 증명.

---

**🔍 상세 요구사항**

**1️⃣ 데이터 관리 및 API 연동 (Firebase 기반)**

- **프로젝트 데이터베이스 (Firestore)**: Firebase Firestore를 사용하여 프로젝트 데이터를 생성, 조회, 수정, 삭제하는 **실시간 CRUD** 기능 구현.
- **실시간 문의 관리 (Firestore)**: 사용자가 제출한 문의 메시지를 Firestore에 실시간으로 저장하고 관리.
- **관리자 인증 (Firebase Authentication)**:
   - 이메일/비밀번호 기반의 관리자 로그인 기능 구현.
   - 로그인 상태를 실시간으로 감지하고, 페이지를 새로고침해도 유지되도록 구현 (onAuthStateChanged).
   - Firestore의 **'보안 규칙(Security Rules)'**을 설정하여, 인증된 관리자만 프로젝트 데이터를 수정/삭제할 수 있도록 접근 제어.

**2️⃣ 사용자 상호작용 (Interaction)**

- **프로젝트 필터링**: Firestore에서 불러온 프로젝트 목록을 카테고리별로 실시간 필터링.
- **관리자 기능 (로그인 시 활성화)**:
   - '새 프로젝트 추가' 기능: 입력 폼을 통해 Firestore에 새로운 프로젝트 문서(Document) 생성.
   - '수정' 기능: 기존 데이터를 폼에 채워 넣고, 수정 시 Firestore의 해당 문서 업데이트.
   - '삭제' 기능: Firestore에서 해당 문서 삭제.
- **기술 숙련도 시각화**: Chart.js를 활용하여 Skills 섹션에 **막대 차트(Bar Chart)** 형태로 기술 숙련도를 시각적으로 표현.
- **지도 연동**: Kakao Maps API를 사용하여 근무 가능 지역을 지도 위에 시각적으로 표시.
- **반응형 UI**: 모든 디바이스에 최적화된 UI 제공.

**3️⃣ 시각적/디자인 요소**

- **인터랙티브 Hero 애니메이션**: GSAP(GreenSock Animation Platform)와 SplitText 플러그인을 활용하여, Hero 섹션의 텍스트가 3D 공간에서 역동적으로 나타나는 'Cosmic Genesis' 애니메이션 구현.
- **인터랙티브 애니메이션**: 스크롤 기반 등장 효과(IntersectionObserver), 필터링 애니메이션 등 적용.
- **부드러운 스크롤**: smooth-scrollbar.js 라이브러리를 연동하여 고급스러운 스크롤 경험 제공.
- **사용자 경험(UX) 개선**: 이메일 주소 복사 시 나타나는 토스트 팝업, 플로팅 액션 버튼(FAB), 동적 툴팁 등을 통해 사용자 편의성 증대.

---

**🔥 핵심 구현 포인트**

- **BaaS 연동 아키텍처**: 프론트엔드(Vanilla JS)와 백엔드 서비스(Firebase)를 연동하여 풀스택 애플리케이션의 데이터 흐름을 설계.
- **실시간 데이터 동기화**: Firestore의 실시간 업데이트 기능(onSnapshot)을 활용하여, 데이터가 변경되면 별도의 페이지 새로고침 없이 UI가 자동으로 갱신되도록 구현.
- **라이브러리 커스터마이징 및 통합**: GSAP로 복잡한 타임라인 기반 애니메이션을 직접 설계하고, Chart.js, Kakao Maps API 등 다양한 외부 라이브러리를 프로젝트의 목적에 맞게 통합하고 제어.
- **보안 규칙 작성**: 데이터베이스의 접근 권한을 서버(Firestore) 레벨에서 제어하여 클라이언트 측의 조작을 원천적으로 방지.

---

**🎯 이 프로젝트를 통해 얻어가는 것**

- **프론트엔드와 백엔드 서비스 연동 경험**: 실제 서비스와 유사한 클라이언트-서버(BaaS) 통신 아키텍처 설계 능력.
- **실시간 데이터베이스(Firestore) CRUD** 및 **안전한 인증(Authentication)** 시스템 구현 경험.
- **외부 라이브러리(GSAP, Chart.js)와 API(Kakao Maps)를 프로젝트에 통합하고 커스터마이징하는 능력.**
- 프레임워크 없이도 **현대적인 풀스택 웹 애플리케이션을 구축할 수 있다는 기술적 증명**과 자신감.

---

**💻 사용 기술**

- **Core**: HTML, CSS, Vanilla JavaScript (ES6+, async/await)
- **Backend as a Service (BaaS)**: **Firebase Authentication**, **Firebase Firestore**
- **Layout**: Flexbox, CSS Grid, Media Query
- **API**: IntersectionObserver API, Kakao Maps API
- **Library**: smooth-scrollbar.js, **GSAP (SplitText)**, **Chart.js**

---

**🔹 세부 기능 목록 + UI 구성 포인트**

| **기능**                 | **설명**                                      | **구현 포인트**                                       |
| ------------------------ | --------------------------------------------- | ----------------------------------------------------- |
| **관리자 인증**          | Firebase 기반 로그인/로그아웃, 상태 유지      | Firebase SDK, onAuthStateChanged                      |
| **프로젝트 렌더링**      | Firestore DB 데이터를 HTML로 변환             | async/await, Firebase SDK (onSnapshot), map           |
| **실시간 업데이트**      | DB 변경 시 화면 자동 갱신                     | Firestore onSnapshot 리스너                           |
| **보안 규칙**            | 인증된 사용자만 쓰기(write) 권한 부여         | Firestore Security Rules (request.auth.uid != null)   |
| **GSAP Hero 애니메이션** | Hero 영역 텍스트의 3D 등장 효과               | GSAP Timeline, SplitText, from() 애니메이션           |
| **기술 스택 시각화**     | Skills 영역 숙련도를 막대 차트로 표현         | Chart.js API, Bar Chart 타입, 반응형 옵션             |
| **CRUD 인터페이스**      | 모달을 통한 프로젝트 생성/수정/삭제           | DOM 조작, Firebase SDK (addDoc, updateDoc, deleteDoc) |
| **실시간 문의 폼**       | 사용자가 남긴 메시지를 Firestore에 저장       | addDoc, collection API, Form submit 이벤트 핸들링     |
| **지도 연동**            | 근무 가능 지역을 시각적으로 안내              | Kakao Maps API, 마커 및 인포윈도우 생성               |
| **UI/UX 개선**           | 플로팅 버튼, 동적 툴팁, 자동 명언 슬라이더 등 | DOM 이벤트 리스너, setInterval, navigator.clipboard   |
| **반응형 설계**          | 모바일/태블릿/데스크탑 최적화                 | Media Query, grid-template-columns 변경               |
