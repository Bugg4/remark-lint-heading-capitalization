import { lintRule } from 'unified-lint-rule'
import { visit } from 'unist-util-visit'

import defaultLowerCaseWords from './lib/defaultLowerCaseWords.js'
import { capitalizeWord, isUpperCase } from './lib/utils.js'

const cache = {}

export function fixTitle(title, options) {
  const correctTitle = title.replace(/[^\s-]+/g, (word, index) => {
    // If the word is already in uppercase, return it as is.
    if (isUpperCase(word)) {
      return word
    }

    // If true, words in options.lowerCaseWords can also apply to the first word in the title.
    // Words in the default list will instead be capitalized by default if they are the first word, UNLESS they're explicitly included in the user's custom list
    const allowFirstWordLowerCase = options.allowFirstWordLowerCase ?? false

    // Words that should always be lowercase, (applies only to non-first words, unless allowFirstWordLowerCase is true)
    const userLowerCaseWords = options.lowerCaseWords ?? []

    const allLowerCaseWords = [...defaultLowerCaseWords, ...userLowerCaseWords]

    const lowerCaseWord = word.toLowerCase()

    // Only allow first word to be lowercase if it's in the user's custom list and allowFirstWordLowerCase is true.
    if (
      allLowerCaseWords.includes(lowerCaseWord) &&
      ((index === 0 &&
        allowFirstWordLowerCase &&
        userLowerCaseWords.includes(lowerCaseWord)) ||
        index !== 0)
    ) {
      return lowerCaseWord
    }

    // Checking the first letter of a word is not capitalized.
    if (!isUpperCase(word.charAt(0))) {
      return capitalizeWord(word)
    }

    return word
  })

  // Putting correct title in the cache to prevent handling the same titles in other docs.
  cache[correctTitle] = correctTitle

  return correctTitle
}

function headingCapitalization(tree, file, options = {}) {
  const { ignorePattern } = options
  let ignorePatterns = []

  // Process ignorePattern to create an array of regular expressions
  if (Array.isArray(ignorePattern)) {
    ignorePatterns = ignorePattern.map(pattern => new RegExp(pattern, 'g'))
  } else if (ignorePattern) {
    ignorePatterns = [new RegExp(ignorePattern, 'g')]
  }

  visit(tree, 'heading', node => {
    let processedTitle = node.children.reduce(
      (acc, child) =>
        acc +
        (child.type === 'inlineCode' ? `\`${child.value}\`` : child.value),
      ''
    )

    // Create a processed version of the title by removing ignored patterns
    for (const regex of ignorePatterns) {
      processedTitle = processedTitle.replace(regex, '')
    }

    // If the processed title is found among the correct titles, skip further processing
    if (cache[processedTitle]) {
      return
    }

    const correctTitle = fixTitle(processedTitle, options)

    if (correctTitle !== processedTitle) {
      file.message(
        `Heading capitalization error. Expected: '${correctTitle}' found: '${processedTitle}'`,
        node
      )
    }
  })
}

const remarkLintHeadingCapitalization = lintRule(
  'remark-lint:heading-capitalization',
  headingCapitalization
)

export default remarkLintHeadingCapitalization
export { cache }
