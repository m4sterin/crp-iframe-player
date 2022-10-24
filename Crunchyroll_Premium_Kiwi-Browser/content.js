const query = qry => document.body.querySelector(qry)
var preservedState = null
var width = 0

//function que pega algo dentro dentro do html.
function pegaString(str, first_character, last_character) {
  if (str.match(first_character + "(.*)" + last_character) == null) {
    return null;
  } else {
    new_str = str.match(first_character + "(.*)" + last_character)[1].trim()
    return new_str;
  }
}

//function para remover elementos da página
function remove(element, name, untilRemoved = false, callback = () => { }) {
  let tries = 0;
  if (untilRemoved) {
    const finishRemove = setInterval(() => {
      if (query(element) != null) {
        clearInterval(finishRemove)
        console.log(`[CR Premium] Removendo ${name}...`);
        const closeBtn = query(element + ' > .close-button')
        if (closeBtn) closeBtn.click()
        else query(element).style.display = 'none';

        callback()
      }
      else if (tries > 250) clearInterval(finishRemove)
      else tries++
    }, 20)
  } else if (query(element) != null) {
    console.log(`[CR Premium] Removendo ${name}...`);
    query(element).style.display = 'none';
  }
}

// function que optimiza a pagina para dispositivos mobile.
function optimize_for_mobile() {
  console.log("[CR Premium] Optimizando página para mobile...");
  width = document.body.offsetWidth;
  var carousel_move_times = 0;
  var carousel_videos_count = 0;

  carousel_move_times =
    (width < 622 && width > 506) ? 4 :
      (width < 506 && width > 390) ? 3 :
        (width < 390 && width > 274) ? 2 :
          (width < 274 && width > 000) ? 1 : 5


  //Verifica quantos videos tem no slider
  function getChildNodes(node) {
    var children = new Array();
    for (var child in node.childNodes) {
      if (node.childNodes[child].nodeName == "DIV" && node.childNodes[child].attributes.media_id != null) {
        children.push(child);
      }
    }
    return children;
  }

  carousel_videos_count = getChildNodes(document.body.querySelector('div.collection-carousel-scrollable'));

  remove("#game-banner-wrapper", "Game Banner Wrapper")

  var old_element = document.querySelector(".collection-carousel-leftarrow");
  var new_element = old_element.cloneNode(true);
  old_element.parentNode.replaceChild(new_element, old_element);
  var old_element = document.querySelector(".collection-carousel-rightarrow");
  var new_element = old_element.cloneNode(true);
  old_element.parentNode.replaceChild(new_element, old_element);

  //Deixa o video pequeno denovo no primeiro episodio.
  if (document.getElementById('showmedia_video_box_wide') != null) {
    document.getElementById('showmedia_video_box_wide').id = 'showmedia_video_box';
  }
  //Desbuga a seta de avançar o slider.
  const carouselScrollable = document.body.querySelector('div.collection-carousel-scrollable')
  const carouselArrow = document.body.querySelector('a.collection-carousel-rightarrow')
  const arrowClass = "collection-carousel-arrow collection-carousel-rightarrow"

  if (carouselScrollable.lastElementChild.childNodes[1] != undefined) {
    if (carouselScrollable.lastElementChild.childNodes[1].classList.value.indexOf('collection-carousel-media-link-current') == -1) {
      if (carousel_move_times == 4) {
        if (carouselScrollable.lastElementChild.previousElementSibling.childNodes[1].classList.value.indexOf('collection-carousel-media-link-current') == -1) {
          carouselArrow.classList = arrowClass;
        }
      } else carouselArrow.classList = arrowClass;
    } else if (carousel_move_times == 2) carouselArrow.classList = arrowClass;
  }
}

//function que mudar o player para um mais simples.
function importPlayer() {
  var HTML = document.documentElement.innerHTML;
  console.log("[CR Old] Removendo player da Crunchyroll...");
  var elem = document.getElementById('showmedia_video_player');
  elem.parentNode.removeChild(elem);

  console.log("[CR Old] Pegando dados da stream...");
  var video_config_media = JSON.parse(pegaString(HTML, "vilos.config.media = ", ";"));

  //Remove Nota do topo sobre experimentar o premium
  //Remove avisos q o video nn pode ser visto
  //Remove sugestão de inscrever-se para o trial gratuito

  if (document.body.querySelector(".showmedia-trailer-notice") != null) {
    document.body.querySelector(".showmedia-trailer-notice").style.textDecoration = "line-through";
  }
  remove("#showmedia_free_trial_signup", "Free Trial Signup")

  // Simular interação do usuário para deixar em fullscreen automaticamente
  // var element = document.getElementById("template_scroller");
  // if (element) element.click();

  const appendTo = query("#showmedia_video_box") || query("#showmedia_video_box_wide")
  const series = document.querySelector('meta[property="og:title"]');
  const up_next = document.querySelector('link[rel=next]');

  var message = {
    'video_config_media': [JSON.stringify(video_config_media)],
    'lang': [pegaString(HTML, 'LOCALE = "', '",')],
    'series': series ? series.content : undefined,
    'up_next': up_next ? up_next.href : undefined,
  }

  console.log("[CR Old] Adicionando o jwplayer...");
  addPlayer(appendTo, message)
}

//renderiza player na versão beta
function importBetaPlayer(ready = false) {
  var videoPlayer = query('.video-player') || query('#frame');
  if (!ready) {
    setTimeout(() => importBetaPlayer(!!videoPlayer), 100);
    return;
  }
  var lastWatchedPlayer = query('#frame');
  if (query('.video-player') && lastWatchedPlayer)
    lastWatchedPlayer.parentNode.removeChild(lastWatchedPlayer);

  var titleLink = query('.show-title-link')
  if (titleLink) titleLink.style.zIndex = "2";

  console.log("[CR Beta] Removendo player da Crunchyroll...");
  remove('.video-player-placeholder', 'Video Placeholder');
  remove('.video-player', 'Video Player', true);
  remove('.blocked-stream-overlay', 'Blocked Overlay', true);
  videoPlayer.src = '';
  const appendTo = videoPlayer.parentNode;

  console.log("[CR Beta] Pegando dados da stream...");
  var external_lang = preservedState.localization.locale.toLowerCase()
  var ep_lang = preservedState.localization.locale.replace('-', '')
  var ep_id = preservedState.watch.id
  var ep = preservedState.content.media.byId[ep_id]
  if (!ep) { window.location.reload(); return; }
  var series_slug = ep.parentSlug
  var external_id = getExternalId(ep.id).substr(4)
  var old_url = `https://www.crunchyroll.com/${external_lang}/${series_slug}/episode-${external_id}`
  var up_next = document.querySelector('[data-t="next-episode"] > a')
  var playback = ep.playback
  var series = document.querySelector('.show-title-link > h4')?.innerText;

  var message = {
    'playback': playback,
    'old_url': old_url,
    'lang': ep_lang,
    'up_next': up_next ? up_next.href : undefined,
    'series': series ? series : undefined,
  }

  console.log("[CR Beta] Adicionando o jwplayer...");
  console.log("[CR Beta] Antiga URL:", old_url);
  addPlayer(appendTo, message, true)
}

function addPlayer(element, playerInfo, beta = false) {
  console.log("[CR Premium] Adicionando o jwplayer...");
  var ifrm = document.createElement("iframe");
  ifrm.setAttribute("id", "frame");
  ifrm.setAttribute("src", "https://mateus7g.github.io/crp-iframe-player/");
  ifrm.setAttribute("width", "100%");
  ifrm.setAttribute("height", "100%");
  ifrm.setAttribute("frameborder", "0");
  ifrm.setAttribute("scrolling", "no");
  ifrm.setAttribute("allowfullscreen", "allowfullscreen");
  ifrm.setAttribute("allow", "autoplay; encrypted-media *");

  element.appendChild(ifrm)

  chrome.storage.sync.get(['forcemp4', 'aseguir', 'cooldown', 'webvideocaster'], function (items) {
    ifrm.onload = function () {
      playerInfo['webvideocaster'] = items.webvideocaster === undefined ? false : items.webvideocaster;
      playerInfo['up_next_cooldown'] = items.cooldown === undefined ? 5 : items.cooldown;
      playerInfo['up_next_enable'] = items.aseguir === undefined ? true : items.aseguir;
      playerInfo['force_mp4'] = items.forcemp4 === undefined ? false : items.forcemp4;
      playerInfo['version'] = '1.3.0';
      playerInfo['noproxy'] = true;
      playerInfo['beta'] = beta;
      ifrm.contentWindow.postMessage(playerInfo, "*");
    };
  });

  if (!beta && width < 796) optimize_for_mobile();
}

// function p/ redirecionar caso esteja na pg do android
function redirectAndroid() {
  if (window.location.href == "https://www.crunchyroll.com/interstitial/android") {
    window.location.href = "https://www.crunchyroll.com/interstitial/android?skip=1";
  }

  //Adicionando metaTag para poder optimizar para o mobile.
  var metaTag = document.createElement('meta');
  metaTag.name = "viewport"
  metaTag.content = "width=device-width, initial-scale=1.0, shrink-to-fit=no, user-scalable=no"
  document.getElementsByTagName('head')[0].appendChild(metaTag);
  window.scrollTo(0, 0);
}

//function ao carregar pagina.
function onloadfunction() {
  redirectAndroid();

  var HTML = document.documentElement.innerHTML;
  if (pegaString(HTML, "vilos.config.media = ", ";") != null) {
    importPlayer(); // old CR
  } else if (preservedState != null) {
    importBetaPlayer(); // beta CR
    remove(".erc-modal-portal > .overlay > .content-wrapper", "Free Trial Modal", true, () => document.body.classList = [])
    remove(".erc-watch-premium-upsell", "Premium Sidebar", true)
    registerChangeEpisode();
  }
}

// function pra atualizar pagina quando mudar de episodio pela UI beta
var currentURL = window.location.href;

function registerChangeEpisode() {
  setInterval(async () => {
    if (currentURL !== window.location.href) {
      currentURL = window.location.href
      if (currentURL.includes("/watch/")) {
        remove(".erc-watch-premium-upsell", "New Premium Sidebar", true)
        const HTML = await fetch(currentURL)
        console.log("[CR Beta] Searching for new INITIAL_STATE")
        preservedState = JSON.parse(pegaString(HTML, "__INITIAL_STATE__ = ", ";"))
        importBetaPlayer(false)
      }
    }
  }, 50)
}

document.addEventListener("DOMContentLoaded", onloadfunction, false);
document.onreadystatechange = function () {
  if (document.readyState === "interactive") {
    console.log("[CR Beta] Searching for INITIAL_STATE")
    const HTML = document.documentElement.innerHTML
    preservedState = JSON.parse(pegaString(HTML, "__INITIAL_STATE__ = ", ";"))
  }

  const crBetaStyle = document.createElement('style');
  crBetaStyle.innerHTML = `.video-player-wrapper {
    margin-top: 2rem;
    margin-bottom: calc(-3vh - 7vw);
    height: 57.25vw !important;
    max-height: 82vh !important;
  }`;
  document.head.appendChild(crBetaStyle);
}

function fetch(url) {
  return new Promise(async (resolve, reject) => {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.withCredentials = true;
    xhr.onreadystatechange = () => {
      if (xhr.readyState == 4)
        if (xhr.status == 200) resolve(xhr.responseText)
        else reject(xhr.statusText)
    }
    xhr.send();
  })
}

function getExternalId(id) {
  return JSON.parse(localStorage.getItem('externalIds'))[id];
}

var s = document.createElement('script');
s.src = chrome.runtime.getURL('interceptor.js');
s.onload = function () { this.remove(); };
(document.head || document.documentElement).appendChild(s);
