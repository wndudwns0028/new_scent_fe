document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const product = decodeURIComponent(params.get("product") || "");
  const scent = decodeURIComponent(params.get("scent") || "");

  //const API_URL = "http://127.0.0.1:8000";
  const API_URL = 'http://13.209.7.47:8000';
  
  const scentTitle = document.getElementById("scent-title");
  const fragranceList = document.getElementById("fragrance-list");
  const shoppingResults = document.getElementById("shopping-results");
  const breadcrumb = document.getElementById("breadcrumb");
  const shoppingTitle = document.getElementById("shopping-title");
  const sortButton = document.getElementById("sort-button");

  let resultItems = [];
  let sortOrder = 'asc';

  try {
    const res = await fetch(`${API_URL}/fragrances`);
    const data = await res.json();

    const target = data.find(item => item.product === product && item.scent_slug === scent);
    if (!target) {
      scentTitle.textContent = "해당 향기를 찾을 수 없습니다.";
      return;
    }

    scentTitle.textContent = `${product} - ${target.scent}`;

    breadcrumb.innerHTML = `
      
      <a href="/pages/product.html?product=${encodeURIComponent(product)}">← ${product}</a>
    `;

    target.fragrances.forEach((frag) => {
      const fragBtn = document.createElement("div");
      fragBtn.className = "fragrance-tag";
      fragBtn.textContent = frag.name;
      fragBtn.onclick = () => {
        window.location.href = `/pages/fragrance.html?product=${encodeURIComponent(product)}&scent=${encodeURIComponent(scent)}&fragrance=${encodeURIComponent(frag.slug)}`;
      };
      fragranceList.appendChild(fragBtn);
    });

    // 💡 검색 쿼리 생성
    const keywordMap = {
      shampoo: ["샴푸"],
      bodywash: ["바디워시", "샤워젤"],
      handcream: ["핸드크림"],
      perfume: ["향수"]
    };
    const fallbackKeywords = keywordMap[product.toLowerCase()] || [product.toLowerCase()];

    const allFragranceNames = target.fragrances.map(f => f.name.replace(/향$/, ""));
    const queries = [];

    allFragranceNames.forEach(fragName => {
      fallbackKeywords.forEach(k => {
        queries.push(`${fragName} ${k}`);
      });
    });

    const responses = await Promise.all(
      queries.map(async (q) => {
        const r = await fetch(`${API_URL}/naver/search?query=${encodeURIComponent(q)}`);
        const j = await r.json();
        return j.items || [];
      })
    );

    // ✅ title만 기준으로 필터링 (mallName 무시)
    resultItems = responses.flat().filter(item => {
      const plainTitle = stripHtml(item.title).toLowerCase();
      return allFragranceNames.some(f => plainTitle.includes(f.toLowerCase())) &&
             fallbackKeywords.some(k => plainTitle.includes(k));
    });

    shoppingTitle.textContent = `${product} - ${target.scent} 관련 상품`;

    if (resultItems.length === 0) {
      shoppingResults.innerHTML = `<p class="text-gray-500">관련 상품이 없습니다.</p>`;
      return;
    }

    sortAndRenderProducts();
  } catch (err) {
    console.error("에러:", err);
    shoppingResults.innerHTML = `<div class="error-message">데이터를 불러오는 중 오류가 발생했습니다.</div>`;
  }

  sortButton.addEventListener("click", () => {
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    sortButton.textContent = `가격 ${sortOrder === 'asc' ? '▲ 오름차순' : '▼ 내림차순'}`;
    sortAndRenderProducts();
  });

  function sortAndRenderProducts() {
    const sorted = [...resultItems].sort((a, b) => {
      const priceA = parseInt(a.lprice, 10);
      const priceB = parseInt(b.lprice, 10);
      return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
    });

    shoppingResults.innerHTML = '';
    sorted.forEach((item) => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img src="${item.image}" alt="${stripHtml(item.title)}" class="product-image">
        <div class="product-title">${item.title}</div>
        <p class="product-price">${item.lprice}원</p>
        <a href="${item.link}" target="_blank" class="product-link">네이버에서 보기</a>
      `;
      shoppingResults.appendChild(card);
    });
  }

  function stripHtml(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }
});
