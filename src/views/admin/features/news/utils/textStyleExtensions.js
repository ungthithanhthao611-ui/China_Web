import { Extension } from '@tiptap/core'

export const FontFamily = Extension.create({
  name: 'fontFamily',

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: (element) => element.style.fontFamily?.replaceAll('"', '') || null,
            renderHTML: (attributes) => {
              if (!attributes.fontFamily) return {}
              return {
                style: `font-family: ${attributes.fontFamily}`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setFontFamily:
        (fontFamily) =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontFamily }).run(),
      unsetFontFamily:
        () =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontFamily: null }).removeEmptyTextStyle().run(),
    }
  },
})

export const FontSize = Extension.create({
  name: 'fontSize',

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => {
              const value = element.style.fontSize
              return value ? value.replace('px', '') : null
            },
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {}
              return {
                style: `font-size: ${attributes.fontSize}px`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    }
  },
})

export const TextHighlight = Extension.create({
  name: 'textHighlight',

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          highlightColor: {
            default: null,
            parseHTML: (element) => element.style.backgroundColor || null,
            renderHTML: (attributes) => {
              if (!attributes.highlightColor) return {}
              return {
                style: `background-color: ${attributes.highlightColor}; border-radius: 0.2em; padding: 0 0.08em`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setHighlightColor:
        (highlightColor) =>
        ({ chain }) =>
          chain().setMark('textStyle', { highlightColor }).run(),
      unsetHighlightColor:
        () =>
        ({ chain }) =>
          chain().setMark('textStyle', { highlightColor: null }).removeEmptyTextStyle().run(),
    }
  },
})
