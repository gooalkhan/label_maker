# Food Label Maker (식품표시사항 생성기)

Food Label Maker는 식품 패키지에 부착되는 **한글표시사항** 및 **영양성분표**를 규격에 맞춰 직관적으로 제작할 수 있는 데스크톱 애플리케이션입니다. Wails 프레임워크를 기반으로 제작되어 빠르고 가벼우며, 완벽한 해상도를 보장하는 SVG 포맷으로 결과물을 내보냅니다.

## ✨ 주요 기능

*   **직관적인 GUI 에디터**: 복잡한 설정 없이 좌측 패널에서 각 항목(Cell)의 텍스트, 정렬, 옵션을 입력할 수 있습니다.
*   **드래그 앤 드롭 정렬**: 항목들의 순서를 드래그 앤 드롭으로 손쉽게 변경할 수 있습니다.
*   **실시간 SVG 미리보기**: 좌측에서 입력한 내용이 즉각적으로 우측 화면에 밀리미터(mm) 단위로 정확하게 렌더링됩니다.
*   **스마트 레이아웃 엔진**:
    *   법적 최소 글자 크기(10pt) 검증 및 자동 경고
    *   텍스트 길이에 따른 자동 줄바꿈 및 장평(Scale) 조절 기능
    *   `[[헤더]]` 자동 반전(Invert) 및 `{{내용}}` 최소 크기 강제(12pt) 마크업 지원
    *   재활용 마크 등 이미지가 들어갈 수 있는 Placeholder 자동 배치
*   **프로젝트 저장 및 불러오기**: 현재 작업 상태를 JSON 파일로 저장(백업)하고 언제든 다시 불러올 수 있습니다.
*   **SVG 내보내기**: 최종 완성된 라벨을 깨지지 않는 벡터 그래픽(.svg)으로 저장합니다.

---

## 🛠 빌드 및 실행 방법

이 프로젝트는 **Go**와 **바닐라 JavaScript**, 그리고 **Wails v2**를 사용하여 구축되었습니다.

### 1. 필수 사전 준비 (Prerequisites)
애플리케이션을 빌드하기 위해 운영체제에 상관없이 다음 프로그램들이 먼저 설치되어 있어야 합니다.
*   [Go](https://go.dev/doc/install) (버전 1.18 이상)
*   [Node.js 및 npm](https://nodejs.org/) (프론트엔드 빌드용)
*   [Wails CLI](https://wails.io/docs/gettingstarted/installation)
    *   설치 명령어: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`

### 2. 운영체제별 빌드 가이드

터미널을 열고 소스 코드가 있는 `label-maker` 디렉토리로 이동한 뒤, 아래의 OS별 명령어를 실행합니다.

#### 🪟 Windows
Windows 환경에서는 기본적으로 WebView2 런타임이 필요합니다(Windows 11은 기본 탑재).
*   **개발 모드로 실행 (Live Reload 지원)**:
    ```bash
    wails dev
    ```
*   **실행 파일(.exe) 빌드**:
    ```bash
    wails build
    # 크로스 컴파일 시: wails build -platform windows/amd64
    ```
    > 빌드가 완료되면 `build/bin/` 디렉토리에 `label-maker.exe` 파일이 생성됩니다.

#### 🍎 macOS
macOS 환경에서 빌드하려면 Xcode Command Line Tools가 설치되어 있어야 합니다. (`xcode-select --install`로 설치)
*   **개발 모드로 실행**:
    ```bash
    wails dev
    ```
*   **앱 패키지(.app) 빌드**:
    ```bash
    wails build
    # M1/M2 등 Apple Silicon 및 Intel 모두 지원하는 Universal 빌드 시:
    # wails build -platform darwin/universal
    ```
    > 빌드가 완료되면 `build/bin/` 디렉토리에 `label-maker.app`이 생성됩니다.

#### 🐧 Linux
Linux 환경에서는 컴파일을 위해 개발 라이브러리(GTK 및 WebKit)가 추가로 필요합니다. (Ubuntu/Debian 기준)
```bash
sudo apt update
sudo apt install libgtk-3-dev libwebkit2gtk-4.0-dev build-essential
```
*   **개발 모드로 실행**:
    ```bash
    wails dev
    ```
*   **바이너리 빌드**:
    ```bash
    wails build
    # 크로스 컴파일 시: wails build -platform linux/amd64
    ```
    > 빌드가 완료되면 `build/bin/` 디렉토리에 실행 가능한 리눅스 바이너리가 생성됩니다.

---

## 📂 프로젝트 구조

*   `main.go`, `app.go`: 데스크톱 윈도우 생성 및 OS 네이티브 기능(파일 저장 등)을 담당하는 Go 백엔드 코드입니다.
*   `frontend/`: 프론트엔드 폴더입니다.
    *   `index.html`: 메인 레이아웃 및 GUI 컨테이너.
    *   `src/main.js`: 애플리케이션 상태 관리(appState), 드래그 앤 드롭 로직, GUI 렌더링.
    *   `src/renderer.js`: JSON 상태를 SVG 요소로 변환하고 계산하는 핵심 레이아웃 엔진.
    *   `src/style.css`: UI/UX 디자인 및 스타일.
