// @flow
import type { Window } from '../types'

type PortListener = any => void

const bootstrapMetaMaskPopup = function (window: Window, document: Document, manifest: {}) {
  const uint8ArrayToHex = function (arr) {
    const hex = '0123456789abcdef'
    return Array.from(arr).map((v) => hex[Math.floor(v / 16)] + hex[v % 16]).join('')
  }

  const makePort = function (name, id) {
    return {
      name,
      id,

      onDisconnect: {
        addListener (listener: PortListener): void {}
      },

      onMessage: {
        addListener (listener: PortListener): void {
          window.addEventListener('port:message', function (evt) {
            if (evt.detail.id === id) {
              listener(evt.detail.data)
            }
          }, false)
        }
      },

      postMessage (message: any): void {
        window.webkit.messageHandlers.reactNative.postMessage({
          action: 'message',
          data: message,
          id
        })
      }
    }
  }

  window.browser = {
    runtime: {
      connect ({ name }: { name: string }) {
        const id = uint8ArrayToHex(window.crypto.getRandomValues(new Uint8Array(8)))

        window.setTimeout(function () {
          window.webkit.messageHandlers.reactNative.postMessage({
            action: 'connect',
            url: location.href,
            name,
            id
          })
          window.addEventListener('pagehide', function (evt) {
            window.webkit.messageHandlers.reactNative.postMessage({
              action: 'disconnect',
              id
            })
          }, false)
        }, 1)

        return makePort(name, id)
      },

      getManifest () {
        return manifest
      }
    }
  }

  const script = document.createElement('script')
  script.src = '/scripts/popup.js'
  script.onload = function () {
    this.parentNode.removeChild(this)
  }
  if (document.body) {
    document.body.appendChild(script)
  }
}

export default bootstrapMetaMaskPopup
