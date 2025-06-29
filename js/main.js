// 데이터 및 상태 관리
let allData = [];
let hoveredProductElement = null;
let hoveredScentElement = null;
let resultItems = [];
let sortOrder = 'asc';

// API URL 설정
// const API_URL = 'http://127.0.0.1:8000/fragrances'; // 실제 API 경로로 수정해주세요
const API_URL = 'http://13.209.7.47:8000/fragrances';
// API 호출 함수
async function fetchData() {
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`API 요청 실패: ${response.status}`);
        }
        
        const data = await response.json();
        allData = data;
        renderProductList();
    } catch (err) {
        console.error("API fetch error:", err);
        // 에러 메시지를 화면에 표시
        displayError("데이터를 불러오는 중 오류가 발생했습니다.");
    }
}

// 에러 메시지 표시 함수
function displayError(message) {
    const productContainer = document.getElementById('product-container');
    productContainer.innerHTML = `<div class="error-message">${message}</div>`;
}

// 제품 목록 렌더링 함수
function renderProductList() {
    const productContainer = document.getElementById('product-container');
    productContainer.innerHTML = ''; // 기존 내용 초기화
    
    // 데이터가 없는 경우 처리
    if (!allData || allData.length === 0) {
        displayError("표시할 데이터가 없습니다.");
        return;
    }
    
    // 고유한 제품 이름 추출 (중복 제거)
    const productList = [...new Set(allData.map(item => item.product))];
    
    productList.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product-item';
        
        // 제품 버튼 생성
        const productButton = document.createElement('div');
        productButton.className = 'product-button';
        productButton.textContent = product;
        productButton.onclick = () => {
            window.location.href = `/pages/product.html?product=${product}`;
        };
        
        // scent 드롭다운 생성
        const dropdown = document.createElement('div');
        dropdown.className = 'dropdown';
        
        // 현재 제품에 속한 scent들만 필터링
        const productScents = allData.filter(item => item.product === product);
        
        productScents.forEach(item => {
            const scentItem = document.createElement('div');
            scentItem.className = 'dropdown-item';
            
            const scentLink = document.createElement('div');
            scentLink.className = 'scent-link';
            scentLink.textContent = item.scent;
            // scent 클릭 시 scent.html로 이동
            scentLink.onclick = () => {
                window.location.href = `/pages/scent.html?product=${encodeURIComponent(product)}&scent=${encodeURIComponent(item.scent_slug)}`;
            };
            
            // fragrance 서브 드롭다운 생성
            const subDropdown = document.createElement('div');
            subDropdown.className = 'sub-dropdown';
            
            // item.fragrances가 존재하고 배열인지 확인
            if (item.fragrances && Array.isArray(item.fragrances)) {
                item.fragrances.forEach(frag => {
                    const fragItem = document.createElement('div');
                    fragItem.className = 'sub-dropdown-item';
                    fragItem.textContent = frag.name;
                    // fragrance 클릭 시 fragrance.html로 이동 (추후 페이지 구성 예정)
                    fragItem.onclick = () => {
                        window.location.href = `/pages/fragrance.html?product=${encodeURIComponent(product)}&scent=${encodeURIComponent(item.scent_slug)}&fragrance=${encodeURIComponent(frag.slug)}`;
                    };
                    
                    subDropdown.appendChild(fragItem);
                });
            }
            
            // 이벤트 리스너 설정
            scentItem.addEventListener('mouseenter', () => {
                if (hoveredScentElement) {
                    const prevSubDropdown = hoveredScentElement.querySelector('.sub-dropdown');
                    if (prevSubDropdown) {
                        prevSubDropdown.style.display = 'none';
                    }
                }
                subDropdown.style.display = 'block';
                hoveredScentElement = scentItem;
            });
            
            scentItem.appendChild(scentLink);
            scentItem.appendChild(subDropdown);
            dropdown.appendChild(scentItem);
        });
        
        // 이벤트 리스너 설정
        productElement.addEventListener('mouseenter', () => {
            if (hoveredProductElement) {
                const prevDropdown = hoveredProductElement.querySelector('.dropdown');
                if (prevDropdown) {
                    prevDropdown.style.display = 'none';
                }
            }
            dropdown.style.display = 'block';
            hoveredProductElement = productElement;
        });
        
        productElement.addEventListener('mouseleave', (e) => {
            if (!productElement.contains(e.relatedTarget)) {
                dropdown.style.display = 'none';
                if (hoveredScentElement) {
                    const subDropdown = hoveredScentElement.querySelector('.sub-dropdown');
                    if (subDropdown) {
                        subDropdown.style.display = 'none';
                    }
                }
            }
        });
        
        productElement.appendChild(productButton);
        productElement.appendChild(dropdown);
        productContainer.appendChild(productElement);
    });
}

// 페이지 로드 시 API 데이터 로드
window.addEventListener('DOMContentLoaded', () => {
    // 로딩 메시지 표시
    const productContainer = document.getElementById('product-container');
    productContainer.innerHTML = '<div class="loading">데이터를 불러오는 중...</div>';
    
    // API에서 데이터 가져오기
    fetchData();
});