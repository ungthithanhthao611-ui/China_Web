const LOADING_CLASS = 'is-image-loading'
const LOADED_CLASS = 'is-image-loaded'
const ERROR_CLASS = 'is-image-error'
const LOADING_LABEL = 'Đang tải ảnh...'

function updateImageState(img) {
  if (!(img instanceof HTMLImageElement)) return

  img.classList.remove(LOADING_CLASS, LOADED_CLASS, ERROR_CLASS)

  if (!img.currentSrc && !img.src) return

  if (!img.complete) {
    img.classList.add(LOADING_CLASS)
    img.setAttribute('data-loading-label', LOADING_LABEL)
    return
  }

  img.removeAttribute('data-loading-label')

  if (img.naturalWidth > 0) {
    img.classList.add(LOADED_CLASS)
  } else {
    img.classList.add(ERROR_CLASS)
  }
}

function observeImage(img) {
  updateImageState(img)
}

function collectImages(node, callback) {
  if (node instanceof HTMLImageElement) {
    callback(node)
    return
  }

  if (node instanceof Element) {
    node.querySelectorAll('img').forEach(callback)
  }
}

export function installImageLoading(app) {
  app.directive('image-loading', {
    mounted: observeImage,
    updated: observeImage,
  })

  document.addEventListener(
    'load',
    (event) => {
      updateImageState(event.target)
    },
    true
  )

  document.addEventListener(
    'error',
    (event) => {
      updateImageState(event.target)
    },
    true
  )

  queueMicrotask(() => {
    document.querySelectorAll('img').forEach(updateImageState)
  })

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes') {
        updateImageState(mutation.target)
        return
      }

      mutation.addedNodes.forEach((node) => {
        collectImages(node, updateImageState)
      })
    })
  })

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src', 'srcset'],
  })
}
