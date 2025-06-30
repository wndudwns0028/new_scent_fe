// ✅ 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function () {
    const params = new URLSearchParams(window.location.search);
    const rawProduct = params.get('product');
    const product = decodeURIComponent(rawProduct || '');
  
    console.log('URL 쿼리에서 받은 product (디코딩 후):', product);
  
    if (!product) {
      window.location.href = '/';
      return;
    }
  
    let scents = [];
    let products = [];
    let sortOrder = 'asc';
  
 
    const scentsContainer = document.getElementById('scents-container');
    const productsContainer = document.getElementById('products-container');
    const sortButton = document.getElementById('sort-button');
  
    sortButton.addEventListener('click', toggleSortOrder);
  
    loadData();
  
    // ✅ 향기 정보 + 네이버 API 데이터 불러오기
    async function loadData() {
      try {
        //const API_URL = 'http://127.0.0.1:8000';
        // const API_URL = 'http://13.209.7.47:8000';
        const API_URL = 'https://scent.o-r.kr';
        const response = await fetch(`${API_URL}/fragrances`);
        const data = await response.json();
  
        const filtered = data.filter(item => item.product === product);
        scents = filtered;
  
        const allFrags = filtered.flatMap(item => item.fragrances.map(f => f.name));
        renderScents();
  
        // 🔁 병렬 요청 (Promise.all) + 개선된 필터링
        const productPromises = allFrags.map(async (frag) => {
          const query = `${product} ${frag}`;
          const searchRes = await fetch(`${API_URL}/naver/search?query=${encodeURIComponent(query)}`);
          const searchData = await searchRes.json();
  
          if (searchData.items) {
            const filteredItems = searchData.items.filter(item => {
              const plainTitle = stripHtml(item.title).toLowerCase();
              const keywords = [product.toLowerCase(), '샴푸', 'shampoo']; // 확장 가능
              return keywords.some(keyword => plainTitle.includes(keyword));
            });
            console.log(`[${query}] 필터 전: ${searchData.items.length}, 필터 후: ${filteredItems.length}`);
            return filteredItems;
          }
          return [];
        });
  
        const productResults = await Promise.all(productPromises);
        products = productResults.flat();
  
        renderProducts();
      } catch (err) {
        console.error('데이터 로드 오류:', err);
        productsContainer.innerHTML = `<div class="product-empty">데이터를 불러오는 중 오류가 발생했습니다.</div>`;
      }
    }
  
    // ✅ 향기 목록 렌더링
    function renderScents() {
        scentsContainer.innerHTML = '';
        scents.forEach((item) => {
          const scentCard = document.createElement('div');
          scentCard.className = 'scent-card';
      
          const scentTitle = document.createElement('h2');
          scentTitle.className = 'scent-title';
          scentTitle.textContent = item.scent;
      
          // ✅ 정적 페이지 URL로 변경
          scentTitle.addEventListener('click', () => {
            window.location.href = `/pages/scent.html?product=${encodeURIComponent(product)}&scent=${encodeURIComponent(item.scent_slug)}`;
          });
      
          const fragranceContainer = document.createElement('div');
          fragranceContainer.className = 'fragrances-container';
      
          item.fragrances.forEach((f) => {
            const fragTag = document.createElement('div');
            fragTag.className = 'fragrance-tag';
            fragTag.textContent = f.name;
      
            // ❗ 이 부분도 정적 페이지 방식으로 변경해야 한다면 scent.html 또는 fragrance.html에 맞게 수정 필요
            fragTag.addEventListener('click', () => {
              window.location.href = `/pages/fragrance.html?product=${encodeURIComponent(product)}&scent=${encodeURIComponent(item.scent_slug)}&fragrance=${encodeURIComponent(f.slug)}`;
            });
      
            fragranceContainer.appendChild(fragTag);
          });
      
          scentCard.appendChild(scentTitle);
          scentCard.appendChild(fragranceContainer);
          scentsContainer.appendChild(scentCard);
        });
      }
  
    // ✅ 상품 목록 렌더링
    function renderProducts() {
      productsContainer.innerHTML = '';

      if (products.length === 0) {
        productsContainer.innerHTML = `<div class="product-empty">관련 상품이 없습니다.</div>`;
        return;
      }

      const sorted = getSortedProducts();

      sorted.forEach((item) => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';

        // ✅ 각 필드에 기본값 지정 (오류 방지용)
        const image = item.image || '/assets/no-image.png'; // 이미지가 없을 경우 대체 이미지 사용
        const title = stripHtml(item.title || '상품명 없음');
        const price = item.lprice ? `${item.lprice}원` : '가격 정보 없음';
        const link = item.link || '#';

        // ✅ 하나의 innerHTML로 카드 구성
        productCard.innerHTML = `
          <img src="${image}" alt="${title}" class="product-image">
          <div class="product-title">${title}</div>
          <p class="product-price">${price}</p>
          <a href="${link}" target="_blank" class="product-link">네이버에서 보기</a>
        `;

        productsContainer.appendChild(productCard);
      });
    }

  
    // ✅ 가격 정렬 기능
    function getSortedProducts() {
      return [...products].sort((a, b) => {
        const priceA = parseInt(a.lprice, 10);
        const priceB = parseInt(b.lprice, 10);
        return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
      });
    }
  
    function toggleSortOrder() {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      sortButton.textContent = `가격 ${sortOrder === 'asc' ? '▲ 오름차순' : '▼ 내림차순'}`;
      renderProducts();
    }
  
    // ✅ HTML 태그 제거 유틸 함수
    function stripHtml(html) {
      const tmp = document.createElement('DIV');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    }
  });
  