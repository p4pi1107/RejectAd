async function urlsToRules() {
  const res = await fetch(chrome.runtime.getURL('data.json'))
  const resList = await fetch(chrome.runtime.getURL('ads-and-tracking-extended.txt'))
  const textRes = await resList.text()
  // const domainsList = textRes.split('\n').map(domain => domain.trim()).filter(domain => domain.length > 0);
  // console.log(domainsList.length)
  // console.log(parseUrls(domainsList[1]))
            
  const jsonRes = await res.json()
  console.log(jsonRes)
  // jsonRes.urls = jsonRes.urls.concat(domainsList)
  console.log(jsonRes.urls.length)
  await chrome.storage.local.set({ urls: jsonRes.urls })
  const urlsToRules = jsonRes.urls.map(x => ({"id": jsonRes.urls.indexOf(x) + 1, 
                                      "priority": 1, 
                                      "action": {"type": "block"}, 
                                      "condition": {"urlFilter": parseUrls(x), "resourceTypes": ["main_frame", "sub_frame", "script", "xmlhttprequest", "image", "stylesheet", "font", "object", "media", "websocket", "other"]}}))
  console.log("done")                                    
  return { rules: urlsToRules }
}

async function addDomain(request) {
  const data = await chrome.storage.local.get("rules")
  const rules = data.rules || []
  // create new rule obj
  const isdup = await checkdup(request)
  if (isdup == true) {
    console.log("checked dup true")
    sendResponse({ success: false })
  }
  else {
    newRule = { id: rules.length + 1, 
      priority: 1,
      action: { type: "block" },
      condition: {urlFilter: parseUrls(request.url), resourceTypes: ["main_frame",
      "sub_frame", "script", "xmlhttprequest", "image", "stylesheet", "font",
      "object", "media", "websocket", "other"]}
    }
    rules.push(newRule)
    const storedUrls = await chrome.storage.local.get("urls")
    const urls = storedUrls.urls
    urls.push(request.url)
    await chrome.storage.local.set({ urls })
    // add new rule in saved rules
    await chrome.storage.local.set({ rules }, () => {
        chrome.declarativeNetRequest.updateDynamicRules({
            addRules: [newRule],
            removeRuleIds: []
        }, () => {
          sendResponse({ success: true })
        })
    })
  }
}

function parseUrls(url) {
 
  trimmedUrl = url.match(/(^https:\/\/|^http:\/\/)?(?:www.)?([^\/]+)/)
  // console.log(trimmedUrl)
  url = trimmedUrl[2]
  return url
}
                                                
async function resetRules() {
  const rules = await chrome.declarativeNetRequest.getDynamicRules()
  if (rules.length != 0) {
    ids = rules.map(x => x.id)
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [],
      removeRuleIds: ids
    })
    return true
  }
  return false
}

async function enableRules(enable) {
    const enabledRulesId = await chrome.declarativeNetRequest.getEnabledRulesets()
    console.log(enabledRulesId)
  if (enable) {
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: ["1"],
      disableRulesetIds: []
    })
    console.log("enabled")
    await chrome.storage.local.set({ enabled: true })
  } else {
    const enabledRulesId = await chrome.declarativeNetRequest.getEnabledRulesets()
    console.log(enabledRulesId)
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: [],
      disableRulesetIds: enabledRulesId
    })
    await chrome.storage.local.set({ enabled: false })
  }
  // await chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
  //   tab = tabs[0]
  //   if (tab.url != "chrome://extensions/") {
  //       console.log("enable content")
  //       chrome.tabs.sendMessage(tab.id, { action: 'toggleContent', enabled: enable });
  //       if (chrome.runtime.lastError) {
  //           console.error(`Error sending message to tab ${tab.id}:`, chrome.runtime.lastError.message);
  //       } else {
  //         console.log(`Message sent to tab ${tab.id}`);
  //       }
          
  //     }
  //   })
}

async function deleteRules(ids) {
  // if (!Array.isArray(ids)) {
  //   ids = [ids]
  // }
  await chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [],
    removeRuleIds: [parseInt(ids)]
  })
  var storedUrls = await chrome.storage.local.get("urls")
  var storedRules = await chrome.storage.local.get("rules")
  var updatedRules = storedUrls.urls.splice(parseInt(ids) - 1, 1)
  var storedRules = storedRules.rules.splice(parseInt(ids) - 1, 1)
  await chrome.storage.local.set({updatedRules})
  await chrome.storage.local.set({storedRules})
  return true
}

chrome.runtime.onInstalled.addListener( async () => {
  resetRules()
  // rulelist = await urlsToRules() 
  // await chrome.storage.local.set(rulelist)
  // await chrome.storage.local.set({ urls: ["*://*doubleclick.net/*", "*://*zedo.com/*", "*://googleadservices.com/*"] })
  // await chrome.declarativeNetRequest.updateDynamicRules({
  //   addRules: rulelist.rules,
  //   removeRuleIds: []
  // })
  await chrome.storage.local.set({ switchState: false })
  await chrome.storage.local.set({ enabled: false })
  await enableRules(false)
  // await disableRules()
})



async function handleReq(request, sendResponse) {
  try {
    if (request.action === "blockDomain") {
        const data = await chrome.storage.local.get("rules")
        const rules = data.rules || []
        // create new rule obj
        const isdup = await checkdup(request)
        if (isdup == true) {
          console.log("checked dup true")
          sendResponse({ success: false })
        }
        else {
          await addDomain(request)
        }
        
    } else if (request.action === "resetRules") {
        if (resetRules) {
          sendResponse({ success: true })
        } else {
          sendResponse({ success: false })
        }
    } else if (request.action === "seeRules") {
      console.log(await urlsToRules())
      var success = await seeRules()
      sendResponse({ success: success })
    } else if (request.action === "deleteRule") {
      deleteRules(request.id)
    } else if (request.action === "pauseOnPage") {
      await enableRules(false)
      chrome.tabs.reload()
      sendResponse({ success: success })
    }}
    catch (error) {
      console.error(error);
      sendResponse({ success: false, error: error.message });
    }
}

async function checkdup(request) {
  const data = await chrome.storage.local.get("urls");
  const urls = data.urls || [];
  return urls.includes(request.url);
}

async function seeRules() {
  var displayRules = chrome.declarativeNetRequest.getDynamicRules()
  return true
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  chrome.storage.local.get(['switchState'], async (state) => {
    if (request.action === "switch") {
      await chrome.storage.local.set({ switchState: request.state })
      await enableRules(request.state)
      // alert("REFRESH PAGE!")
    } else if (state.switchState) {
      await handleReq(request, sendResponse).catch(error => {
        console.error('Error in handleReq:', error);
        sendResponse({ success: false, error: error.message });
      });
    }
    else {
      sendResponse({ success: true });
    }
  })
  return true
})


chrome.tabs.onActivated.addListener(function(activeInfo) {
 // how to fetch tab url using activeInfo.tabid
 chrome.tabs.get(activeInfo.tabId, async function(tab) {
    const enabled = await chrome.storage.local.get("enabled")
    const on = await chrome.storage.local.get("switchState")
    if (on.switchState && !enabled.enabled) {
      enableRules(true)
    }
    // chrome.storage.local.set({CurrentUrl: tab.url})
 });
}); 




