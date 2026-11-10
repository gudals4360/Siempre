// Google Analytics 4 (측정 ID: G-1SK7P15M93). 로그인·가입 앱(index.html)과 서비스 화면(siempre-figma-prototype.html)이 함께 쓴다.
// - 개발 중(localhost) 방문은 통계에 섞이지 않게 아무것도 보내지 않는다. 테스트하려면 주소 끝에 ?ga_debug=1 (GA4 DebugView에서 확인)
// - 로그인 앱은 주소가 바뀔 때마다 GA4 "향상된 측정"이 page_view를 자동으로 보낸다.
// - 서비스 화면은 주소가 그대로라서 화면 이동(구독/대화/크레딧)과 주요 버튼 클릭을 직접 이벤트로 보낸다.
// - 입력한 글·이메일·닉네임 같은 개인정보는 보내지 않는다. 버튼 이름과 AI 이름만 보낸다.
(function () {
  var ID = 'G-1SK7P15M93';
  var host = location.hostname;
  var local = host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || /\.localhost$/.test(host);
  var debug = /[?&]ga_debug=1(&|$)/.test(location.search);
  if (local && !debug) return;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', ID, debug ? { debug_mode: true } : {});

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
  document.head.appendChild(s);

  function send(name, params) {
    try { gtag('event', name, params || {}); } catch (e) { /* 통계 때문에 화면이 멈추면 안 된다 */ }
  }

  // 서비스 화면: 상단 메뉴가 바뀌면 어느 화면인지 보낸다
  function watchScreens() {
    var nav = document.querySelector('header nav');
    if (!nav) return;
    var names = { 'n-subscribe': 'subscribe', 'n-chat': 'chat', 'n-credit': 'credit' };
    var last = '';
    function report() {
      var on = nav.querySelector('button.on');
      var name = on && names[on.id];
      if (name && name !== last) { last = name; send('view_screen', { screen_name: name }); }
    }
    new MutationObserver(report).observe(nav, { subtree: true, attributes: true, attributeFilter: ['class'] });
    report();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchScreens);
  else watchScreens();

  // 서비스 화면: 주요 버튼 클릭 (없는 화면에서는 아무 일도 일어나지 않는다)
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('#start, #startFree, #payGo, [data-charge]') : null;
    if (!t) return;
    if (t.id === 'start') send('cta_start_paid');
    else if (t.id === 'startFree') send('cta_start_free');
    else if (t.id === 'payGo') send('payment_submit');
    else send('credit_charge', { ai: t.getAttribute('data-charge') });
  }, true);
})();
