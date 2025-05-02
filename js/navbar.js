document.addEventListener('DOMContentLoaded', function () {
    const contentElement = document.getElementById('nav-state');

    if (!contentElement) return;

    const queryString = window.location.search;
    const params = new URLSearchParams(queryString);
  
    // 전체 쿼리 항목들을 배열로 추출
    const entries = Array.from(params.entries());
  
    // 쿼리 항목이 없으면 무시
    if (entries.length === 0) return;
  
    // 마지막 항목
    const [lastKey, lastValue] = entries[entries.length - 1];
  
    let output = "";
  
    if (lastKey === "product") {
      output = `${lastValue} 전체 목록 조회`;
    } else if (lastKey === "scent") {
      output = `${lastValue}향 전체 목록 조회`;
    } else if (lastKey === "fragrance" && params.has("scent")) {
      const scent = params.get("scent");
      output = `${scent} ${lastValue}향 전체 목록 조회`;
    }
  
    contentElement.innerHTML = output;
})
