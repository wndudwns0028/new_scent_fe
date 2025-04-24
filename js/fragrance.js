document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const product = decodeURIComponent(params.get("product") || "");
    const scent = decodeURIComponent(params.get("scent") || "");
    const fragrance = decodeURIComponent(params.get("fragrance") || "");
  
    const API_URL = "http://127.0.0.1:8000";
  
    const breadcrumb = document.getElementById("breadcrumb");
    const mainTitle = document.getElementById("main-title");
    const subTitle = document.getElementById("sub-title");
    const fragranceButtons = document.getElementById("fragrance-buttons");
    const productResults = document.getElementById("product-results");
    const sortButton = document.getElementById("sort-button");
  
    let resultItems = [];
    let sortOrder = 'asc';
  
    try {
      const res = await fetch(`${API_URL}/fragrances`);
      const data = await res.json();
  
      const scentGroup = data.find(item => item.product === product && item.scent_slug === scent);
      if (!scentGroup) {
        mainTitle.textContent = "향기 정보를 찾을 수 없습니다.";
        return;
      }
  
      const currentFragrance = scentGroup.fragrances.find(f => f.slug === fragrance);
      if (!currentFragrance) {
        subTitle.textContent = "해당 세부 향기를 찾을 수 없습니다.";
        return;
      }
  
      // 🧭 경로 및 타이틀 설정
      breadcrumb.innerHTML = `
        <a href="/index.html" class="text-blue-500 underline">← 홈</a>
        <a href="/pages/product.html?product=${product}" class="text-blue-500 underline">← ${product}</a>
        <a href="/pages/scent.html?product=${product}&scent=${scent}" class="text-blue-500 underline">← ${scentGroup.scent}</a>
      `;
      mainTitle.textContent = `${product} - ${scentGroup.scent}`;
      subTitle.textContent = `세부 향기: ${currentFragrance.name}`;
  
      // 🌸 다른 세부향 버튼들
      scentGroup.fragrances.forEach(f => {
        const btn = document.createElement("div");
        btn.className = `px-4 py-2 rounded-full border text-sm cursor-pointer hover:bg-blue-100 ${f.slug === fragrance ? "bg-blue-200 font-semibold" : ""}`;
        btn.textContent = f.name;
        btn.onclick = () => {
          window.location.href = `/pages/fragrance.html?product=${product}&scent=${scent}&fragrance=${f.slug}`;
        };
        fragranceButtons.appendChild(btn);
      });
  
      // 🔍 검색 쿼리 구성
      const cleaned = currentFragrance.name.replace(/향$/, "");
  
      const keywordMap = {
        shampoo: ["샴푸"],
        bodywash: ["바디워시", "샤워젤"],
        handcream: ["핸드크림"],
        perfume: ["향수"]
      };
      const fallbackKeywords = keywordMap[product.toLowerCase()] || [product];
  
      const queries = [
        `${cleaned} ${product}`,
        ...fallbackKeywords.map(k => `${cleaned} ${k}`)
      ];
  
      const responses = await Promise.all(
        queries.map(async (q) => {
          const r = await fetch(`${API_URL}/naver/search?query=${encodeURIComponent(q)}`);
          const j = await r.json();
          return j.items || [];
        })
      );
  
      // 🎯 결과 필터링
      resultItems = responses.flat().filter(item => {
        const plainTitle = stripHtml(item.title).toLowerCase();
        return fallbackKeywords.some(keyword => plainTitle.includes(keyword));
      });
  
      if (resultItems.length === 0) {
        productResults.innerHTML = `<p class="text-gray-500">관련 상품이 없습니다.</p>`;
        return;
      }
  
      sortAndRenderProducts();
    } catch (err) {
      console.error("🧨 에러 발생:", err);
      productResults.innerHTML = `<div class="error-message">데이터를 불러오는 중 오류가 발생했습니다.</div>`;
    }
  
    // ✅ 정렬 버튼 동작
    sortButton.addEventListener("click", () => {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      sortButton.textContent = `가격 ${sortOrder === 'asc' ? '▲ 오름차순' : '▼ 내림차순'}`;
      sortAndRenderProducts();
    });
  
    // ✅ 렌더링 함수
    function sortAndRenderProducts() {
      const sorted = [...resultItems].sort((a, b) => {
        const priceA = parseInt(a.lprice, 10);
        const priceB = parseInt(b.lprice, 10);
        return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
      });
  
      productResults.innerHTML = '';
      sorted.forEach(item => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
          <img src="${item.image}" alt="${stripHtml(item.title)}" class="product-image">
          <div class="product-title">${item.title}</div>
          <p class="product-price">${item.lprice}원</p>
          <a href="${item.link}" target="_blank" class="product-link">네이버에서 보기</a>
        `;
        productResults.appendChild(card);
      });
    }
  
    function stripHtml(html) {
      const tmp = document.createElement("div");
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || "";
    }
  });
  