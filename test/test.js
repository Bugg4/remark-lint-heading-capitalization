import fs from 'fs'
import path from 'path'
import assert from 'node:assert/strict'
import test from 'node:test'
import { remark } from 'remark'
import { compareMessage } from 'vfile-sort'
import remarkLintHeadingCapitalization from '../index.js'

const invalidMdPath = path.join(import.meta.dirname, 'docs', 'invalid.md')
const validMdPath = path.join(import.meta.dirname, 'docs', 'valid.md')

const invalidMd = fs.readFileSync(invalidMdPath, 'utf-8')
const validMd = fs.readFileSync(validMdPath, 'utf-8')

test('[no options] find wrong capitalizations in headings', async () => {
  const result = await remark()
    .use(remarkLintHeadingCapitalization)
    .process(invalidMd)

  result.messages.sort(compareMessage)

  assert.deepEqual(
    result.messages.map(d => d.reason),
    [
      "Heading capitalization error. Expected: 'Where to Ask Questions' found: 'Where To Ask questions'",
      "Heading capitalization error. Expected: 'An Apple' found: 'an Apple'",
      "Heading capitalization error. Expected: 'Яблоко' found: 'яблоко'",
      "Heading capitalization error. Expected: 'À La Carte' found: 'À la carte'",
      "Heading capitalization error. Expected: 'Enable 2FA on GitHub' found: 'Enable 2FA On GitHub'",
      "Heading capitalization error. Expected: 'Flight-or-Fight' found: 'Flight-Or-fight'"
    ]
  )
})

test('[no options] no errors found', async () => {
  const result = await remark()
    .use(remarkLintHeadingCapitalization)
    .process(validMd)

  assert.strictEqual(result.messages.length, 0)
})

test('[lowerCaseWords] custom list of lowercase words', async () => {
  const result1 = await remark()
    .use(remarkLintHeadingCapitalization, {
      lowerCaseWords: ['die', 'der', 'und']
    })
    .process('# Der Wolf und die Sieben Ziegen')

  assert.strictEqual(result1.messages.length, 0)
})

test('[ignorePattern] custom ignored pattern', async () => {
  const result1 = await remark()
    .use(remarkLintHeadingCapitalization, {
      ignorePattern: ['`[^`]+`']
    })
    .process('# How to Use Our `awesome` Library')

  assert.strictEqual(result1.messages.length, 0)
})

test('[ignorePattern] custom ignored pattern on multiple words', async () => {
  const result1 = await remark()
    .use(remarkLintHeadingCapitalization, {
      ignorePattern: ['`[^`]+`']
    })
    .process('# How to Use Our `awesome` Library with `magical-stuff`!')

  assert.strictEqual(result1.messages.length, 0)
})

test('[ignorePattern] custom ignored pattern with a string', async () => {
  const result1 = await remark()
    .use(remarkLintHeadingCapitalization, {
      ignorePattern: 'package-[a-z]+'
    })
    .process('# Read About Our package-manager Barn!')

  assert.strictEqual(result1.messages.length, 0)
})

test('[ignorePattern] custom multiple ignored patterns', async () => {
  const result1 = await remark()
    .use(remarkLintHeadingCapitalization, {
      ignorePattern: ['package-[a-z]+', '`[^`]+`']
    })
    .process(
      '# Read About Our package-manager Barn! Also Check Our `awesome` Library!'
    )

  assert.strictEqual(result1.messages.length, 0)
})

test('[allowFirstWordLowerCase] allow custom lowercase first word', async () => {
  const result = await remark()
    .use(remarkLintHeadingCapitalization, {
      allowFirstWordLowerCase: true,
      lowerCaseWords: ['cats', 'dogs', 'both']
    })
    .process('# cats or dogs or both')

  assert.strictEqual(result.messages.length, 0)
})

test('[allowFirstWordLowerCase] allow custom lowercase first word when formatted', async () => {
  const result = await remark()
    .use(remarkLintHeadingCapitalization, {
      allowFirstWordLowerCase: true,
      lowerCaseWords: ['cats', 'are', 'great']
    })
    .process(
      `# \`cats\` are great
    ## _cats_ are great
    ## __cats__ are great
    ## *cats* are great
    ## **cats** are great
    ## ~~cats~~ are great`
    )

  assert.strictEqual(result.messages.length, 0)
})

test('[allowFirstWordLowerCase] capitalize first word when flag is true but no custom words specified', async () => {
  const result = await remark()
    .use(remarkLintHeadingCapitalization, {
      allowFirstWordLowerCase: true,
      lowerCaseWords: [] // No custom lowerCaseWords provided because we want to test default behavior
    })
    .process('# the quick brown fox')

  assert.strictEqual(result.messages.length, 1)
})

test('[allowFirstWordLowerCase] do not capitalize default lower case word explicitly specified', async () => {
  const result = await remark()
    .use(remarkLintHeadingCapitalization, {
      allowFirstWordLowerCase: true,
      lowerCaseWords: ['the', 'fox'] // `The` is in the default list, but we want to test that it is not capitalized when explicitly included in the user's custom list
    })
    .process('# the Quick Brown fox')

  assert.strictEqual(result.messages.length, 0)
})

test('[allowFirstWordLowerCase] option disabled, capitalize first word even if in list', async () => {
  const result = await remark()
    .use(remarkLintHeadingCapitalization, {
      allowFirstWordLowerCase: false,
      lowerCaseWords: ['the'] // No custom lowerCaseWords provided because we want to test default behavior
    })
    .process('# the quick brown fox')

  assert.strictEqual(result.messages.length, 1)
})
