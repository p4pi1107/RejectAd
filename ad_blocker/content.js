// hide elements with ad keywords or id
function hideAds(element) {
    const adKeywords = ['ad', 'banner', 'sponsor', 'promo', 'popup'];
    const hasAdClass = adKeywords.some(keyword => element.className == keyword);
    const hasAdId = adKeywords.some(keyword => element.id == keyword);

    if (hasAdClass || hasAdId) {
        element.style.display = 'none';
        element.src = ''
        console.log('Ad blocked by class or ID');
    }

    if (['IFRAME', 'OBJECT', 'EMBED'].includes(element.tagName)) {
        element.style.display = 'none';
        console.log('Ad blocked by tag name');
    }
}

// check if media element is an ad
function isAdMedia(element) {
  const adKeywords = ['ad', 'sponsor', 'promo', 'popup', 'doubleclick', 'google-analytics', 'adsrvr', 'scorecardresearch', 'zedo'];
  const src = element.src || '';
  console.log(src)
  return adKeywords.some(keyword => src.includes(keyword));
}

// hide elements if invisible and an ad
function hideInvisibleAds(element) {
  const style = getComputedStyle(element);
  const isHiddenByVisibility = style.visibility === 'hidden' || style.visibility === 'collapsed';
  const isHiddenByOpacity = style.opacity === '0' || style.opacity === '0.0';
  const isHiddenByTransparentBg = style.backgroundColor === 'transparent';

  if ((isHiddenByVisibility || isHiddenByOpacity || isHiddenByTransparentBg) && isAdMedia(element)) {
      element.style.display = 'none';
      console.log('Invisible ad blocked');
  }
}

// remove tracking scripts base on the src of element
async function removeTrackingScripts(isAdBlockerEnabled) {
    const trackingPatterns = [
        /doubleclick\.net/,
        /google-analytics\.com/,
        /googletagmanager\.com/,
        /adsrvr\.org/,
        /scorecardresearch\.com/,
        /zedo\.com/,
        /mc\.yandex\.ru/,
        /yandex\.ru/, 
        /sentry\.io/,
        /newrelic\.com/,
        /bugsnag*/,
        /^ad([sxv]?[0-9]*|system)[_.-]([^.[:space:]]+\.){1,}|[_.-]ad([sxv]?[0-9]*|system)[_.-]/,
        /^(.+[_.-])?adse?rv(er?|ice)?s?[0-9]*[_.-]/,
        /^(.+[_.-])?telemetry[_.-]/,
        /^adim(age|g)s?[0-9]*[_.-]/,
        /^adtrack(er|ing)?[0-9]*[_.-]/,
        /^advert(s|is(ing|ements?))?[0-9]*[_.-]/,
        /^aff(iliat(es?|ion))?[_.-]/,
        /^analytics?[_.-]/,
        /^banners?[_.-]/,
        /^beacons?[0-9]*[_.-]/,
        /^count(ers?)?[0-9]*[_.-]/,
        /^mads\./,
        /^pixels?[-.]/,
        /^stat(s|istics)?[0-9]*[_.-]/,
        // Add more tracking patterns here
    ];

    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
        if (trackingPatterns.some(pattern => pattern.test(script.src))) {
            script.parentNode.removeChild(script);
            console.log('Tracking script removed:', script.src);
        }
    });
}

// scan elements in dom and hide ads
async function scanAndHideAds(isAdBlockerEnabled) {
    if (!isAdBlockerEnabled) return;

    const allElements = document.querySelectorAll('*');
    allElements.forEach(element => {
        hideAds(element);
        hideInvisibleAds(element);
    });
}

async function observe(isAdBlockerEnabled) {
    // MutationObserver to detect new elements added to the DOM
    const observer = new MutationObserver(mutations => {
        if (isAdBlockerEnabled == false) {
            return;
        }
        console.log("help")
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    hideAds(node);
                    hideInvisibleAds(node);
                    if (node.tagName === 'SCRIPT') {
                    removeTrackingScripts()
                    }
                }
            });
        });
    });
    // Start observing the body for child elements addition
    const container = document.documentElement || document.body;
    observer.observe(container, { childList: true, subtree: true });
    console.log("ran")
}

async function start_script() {
    const enablePromise =  await chrome.storage.local.get("enabled")
    const isAdBlockerEnabled = enablePromise.enabled

    // Handle youtube ads
    if (isAdBlockerEnabled) {
        var millisecond = 1000
        if(document.getElementsByClassName("ytp-ad-text").length > 0) {
            const video = document.getElementsByClassName("video-stream html5-main-video")[0];
            video.play();
            video.pause();
            video.currentTime = video.duration;
        }
        ytads = setInterval(() => {
            var blockads; // blocking ads on YT
            blockads = document.getElementsByClassName("ytp-skip-ad-button");
            adDiv = document.getElementsByClassName("video-ads ytp-ad-module");
            if(adDiv.length > 0 && adDiv != undefined) {
                adDiv[0].style.display = 'none'
            }
            // check conditions
            if(blockads.length > 0 && blockads != undefined){
                blockads[0].click()
                
            }
            }, millisecond);
    }
    console.log(isAdBlockerEnabled)
    await scanAndHideAds(isAdBlockerEnabled)
    await removeTrackingScripts(isAdBlockerEnabled)
    await observe(isAdBlockerEnabled)

    window.addEventListener('click', function(event) {
        console.log("click listener");
    
        if (!isAdBlockerEnabled) return;
    
        let target = event.target;
    
        while (target && target !== document) {
            // Check if the target is a link that opens in a new tab and does not have the download attribute
            if (target.tagName === 'A' && target.target === '_blank' && !target.hasAttribute('download')) {
                // Additional checks to avoid blocking legitimate buttons/links
                if (target.offsetParent === null) { // Check if the element is invisible
                    event.preventDefault();
                    console.log('Popup tab blocked: invisible link');
                    return;
                }
                
                // Check for specific classes or IDs that indicate an ad
                if (target.classList.contains('ad-link') || target.id === 'ad-link') {
                    event.preventDefault();
                    console.log('Popup tab blocked: ad link');
                    return;
                }
            }
            target = target.parentNode;
        }
    }, true);
}

start_script()


