async function getURL() {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true})
    url = tab.url
    console.log(url)
    trimmedUrl = url.match(/^https:\/\/(?:www.)?([^\/]+)/)
    console.log(trimmedUrl)
    url = "*://*" + trimmedUrl[1] + "/*"
    chrome.runtime.sendMessage({ action: "addRule", url}, (response) => {
        if (response.success) {
            console.log("Added rule")
        } else {
            console.log("nah")
        }
    })
}

function seeRules() {
    chrome.runtime.sendMessage({ action: "seeRules"}, (response) => {
        console.log("received message")
        if (response.success) {
            console.log("displayed Rules")
        } else {
            console.log("failed to display")
        }
        
    })
}

function resetRules() {
    chrome.runtime.sendMessage({ action: "resetRules"}, (response) => {
        if (response.success) {
            console.log("resetted Rules")
        } else {
            console.log("failed to reset")
        }
        
    })
}

function deleteRule() {
    const id = document.getElementById("idInput").value
    chrome.runtime.sendMessage({ action: "deleteRule", id: id }, (response) => {
        if (response.success) {
            console.log("deleted rule")
        } else {
            console.log("failed to delete rule")
        }
    })
}

async function pauseOnPage() {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true})
    chrome.runtime.sendMessage({ action: "pauseOnPage", tabId: tab.windowId }, (response) => {
        if (response.success) {
            console.log("paused ads on page")
        } else {
            console.log("failed to pause ads")
        }
    })
}

async function blockDomain() {
    const domain = document.getElementById("domainInput").value
    chrome.runtime.sendMessage({ action: "blockDomain", url: domain }, (response) => {
        if (response.success) {
            console.log("blocked domain" + domain)
        } else {
            console.log("failed to block domain")
        }
    })
}

document.getElementById("addButton").addEventListener("click", blockDomain)
document.getElementById("pauseOnSite").addEventListener("click", pauseOnPage)
document.addEventListener('DOMContentLoaded', function() {
    var roundedSwitch = document.getElementById('onOffSwitch');
  
    // Function to update the switch state
    function updateSwitchState(switchElement) {
      var state = switchElement.checked;
      console.log('Switch is ' + (state ? 'ON' : 'OFF'));
      chrome.runtime.sendMessage({ action: "switch", state: state }, (response) => {
        if (response.success) {
            console.log("deleted rule")
        } else {
            console.log("failed to delete rule")
        }
        // Store the state in chrome.storage.local
        chrome.storage.local.set({switchState: state});
    })
      // Store the state in chrome.storage.local
    }
  
    // Initialize switch states from storage
    chrome.storage.local.get(['switchState'], function(result) {
      if (result.switchState !== undefined) {
        roundedSwitch.checked = result.switchState;
      }
    });
  
    // Add event listeners to switches
  
    roundedSwitch.addEventListener('change', function() {
      updateSwitchState(roundedSwitch);
    });
    return true
  });