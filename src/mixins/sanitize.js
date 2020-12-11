import DOMPurify from 'dompurify'
const allowedDomains = /^(https:\/\/milovana\.com\/|https:\/\/oeos-player-preview\.herokuapp\.com\/)/
const cssUrlMatcher = /url[\s ]*\(['"\s ]*()([^)'"]+)['"\s ]*\)/gi

export default {
  data: () => ({}),
  mounted() {
    DOMPurify.addHook('beforeSanitizeAttributes', (node, data, config) => {
      if (node instanceof Element) {
        if (node.hasAttribute('style')) {
          node.setAttribute(
            'style',
            this.sanitizeStyle(node.getAttribute('style'))
          )
        }

        if (node.hasAttribute('src')) {
          node.setAttribute('src', this.sanitizeSrc(node.getAttribute('src')))
        }

        if (node.hasAttribute('srcset')) {
          const srcset = node.getAttribute('srcset').split(',')
          for (let i = 0, l = srcset.length; i < l; i++) {
            srcset[i] = this.sanitizeSrc(srcset[i])
          }
          node.setAttribute('srcset', srcset.join(','))
        }

        if (node.hasAttribute('href')) {
          node.setAttribute(
            'href',
            this.sanitizeHref(node.getAttribute('href'))
          )
        }
      }
    })
    DOMPurify.addHook('uponSanitizeElement', (node, data, config) => {
      // Do something with the current node and return it
      // You can also mutate hookEvent (i.e. set hookEvent.forceKeepAttr = true)
      if (data.tagName === 'style') {
        let style = node.textContent
        node.textContent = this.sanitizeStyle(style)
      }
      return node
    })
  },
  methods: {
    sanitizeHref(href) {
      if (!href.match(allowedDomains)) {
        console.error('Blocked invalid href: ' + href)
        return '#invalid-href'
      }
      return href
    },
    sanitizeSrc(url) {
      return this.locatorLookup(url).href
    },
    sanitizeStyle(style) {
      if (style.match(/@import/i)) {
        console.error('@import not allowed in stylesheet', style)
        return ''
      }
      if (style.match(/expression/i)) {
        console.error('expression not allowed in stylesheet', style)
        return ''
      }
      let match
      while ((match = cssUrlMatcher.exec(style)) !== null) {
        const replacement = `url("${this.sanitizeSrc(match[2].trim())}")`
        style = style.replaceAll(match[0], replacement)
      }
      return style
    },
    sanitizeHtml(html) {
      if (typeof html !== 'string' || !html) return ''
      const result = DOMPurify.sanitize(html, {
        // FORCE_BODY: false,
        IN_PLACE: true,
      })
      return result
    },
  },
}
