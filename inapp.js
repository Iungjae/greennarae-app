/* 그린나래 · 앱 안의 브라우저(카카오톡·인스타그램 등)로 열었을 때 기본 브라우저로 보내기
   - 카카오톡: 공식 스킴으로 사파리/크롬 자동 실행
   - 안드로이드 기타 인앱: 크롬 인텐트로 자동 실행
   - 자동 이동이 안 되는 경우(iOS 기타 인앱 등): 여는 방법 안내 */
(function () {
  var ua = navigator.userAgent || '', url = location.href;
  var standalone = false;
  try { standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) {}
  if (standalone) return;
  var isKakao = /KAKAOTALK/i.test(ua);
  var isAndroid = /Android/i.test(ua);
  var inApp = isKakao || /NAVER\(inapp|Instagram|FBAN|FBAV|FB_IAB|Line\/|DaumApps|everytime|; wv\)/i.test(ua);
  if (!inApp) return;

  function openExternal() {
    if (isKakao) location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url);
    else if (isAndroid) location.href = 'intent://' + url.replace(/^https?:\/\//, '') + '#Intent;scheme=https;package=com.android.chrome;end';
  }
  var tried = false;
  try { tried = sessionStorage.getItem('gn_ext') === '1'; sessionStorage.setItem('gn_ext', '1'); } catch (e) {}
  if (!tried && (isKakao || isAndroid)) openExternal();

  function guide() {
    if (document.getElementById('gnInapp')) return;
    var how = isAndroid ? '오른쪽 위 <b>⋮</b> 버튼을 누르고 <b>다른 브라우저로 열기</b>를 선택해 주세요.'
                        : '오른쪽 아래 <b>⋯</b>(또는 공유) 버튼을 누르고 <b>Safari로 열기</b>를 선택해 주세요.';
    var el = document.createElement('div');
    el.id = 'gnInapp';
    el.setAttribute('role', 'dialog');
    el.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center;padding:16px;padding-bottom:calc(16px + env(safe-area-inset-bottom));font-family:-apple-system,BlinkMacSystemFont,"Pretendard Variable",Pretendard,system-ui,sans-serif;word-break:keep-all';
    el.innerHTML =
      '<div style="width:min(420px,100%);background:#fff;color:#1c1c1e;border-radius:20px;padding:22px 20px 16px;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.25)">' +
        '<div style="font-size:17px;font-weight:700;margin-bottom:8px">기본 브라우저에서 열어 주세요</div>' +
        '<div style="font-size:15px;line-height:1.55;color:#636366;margin-bottom:18px">앱 안의 브라우저에서는 앱 설치와 알림이 동작하지 않아요.<br>' + how + '</div>' +
        ((isKakao || isAndroid) ? '<button type="button" data-a="open" style="width:100%;height:50px;border:0;border-radius:12px;background:#1a7a45;color:#fff;font:600 17px inherit;margin-bottom:8px">기본 브라우저로 열기</button>' : '') +
        '<button type="button" data-a="copy" style="width:100%;height:50px;border:0;border-radius:12px;background:#f2f2f7;color:#1c1c1e;font:600 17px inherit;margin-bottom:8px">링크 복사</button>' +
        '<button type="button" data-a="close" style="width:100%;height:44px;border:0;background:none;color:#636366;font:500 15px inherit">여기서 계속 보기</button>' +
      '</div>';
    el.addEventListener('click', function (ev) {
      var a = ev.target && ev.target.getAttribute && ev.target.getAttribute('data-a');
      if (a === 'open') openExternal();
      else if (a === 'copy') {
        var done = function () { ev.target.textContent = '복사했어요'; };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { prompt('링크를 길게 눌러 복사하세요', url); });
        else prompt('링크를 길게 눌러 복사하세요', url);
      } else if (a === 'close') el.remove();
    });
    document.body.appendChild(el);
  }
  var show = function () { setTimeout(guide, (isKakao || isAndroid) && !tried ? 1500 : 0); };
  if (document.body) show(); else document.addEventListener('DOMContentLoaded', show);
})();
