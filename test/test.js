import fs from 'fs'
import path from 'path'
import assert from 'node:assert/strict'
import test from 'node:test'
import { remark } from 'remark'
import { compareMessage } from 'vfile-sort'
import remarkLintHeadingCapitalization from '../index.js'
import { cache } from '../index.js'

const invalidMdPath = path.join(import.meta.dirname, 'docs', 'invalid.md')
const validMdPath = path.join(import.meta.dirname, 'docs', 'valid.md')

const invalidMd = fs.readFileSync(invalidMdPath, 'utf-8')
const validMd = fs.readFileSync(validMdPath, 'utf-8')

test.beforeEach(() => {
  // Clear the cache before each test to ensure a clean state
  for (const key in cache) {
    delete cache[key]
  }
})

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
    .process('# a Quick Brown Fox')

  assert.match(
    result.messages[0].reason,
    /Heading capitalization error. Expected: 'A Quick Brown Fox' found: 'a Quick Brown Fox'/
  )
})

test('[allowFirstWordLowerCase] do not capitalize default lower case word explicitly specified', async () => {
  const result = await remark()
    .use(remarkLintHeadingCapitalization, {
      allowFirstWordLowerCase: true,
      lowerCaseWords: ['the'] // `The` is in the default list, but we want to test that it is not capitalized when explicitly included in the user's custom list and it appears as the first word
    })
    .process('# the Quick Brown Fox')

  assert.strictEqual(result.messages.length, 0)
})

test('[allowFirstWordLowerCase] option disabled, capitalize first word even if in list', async () => {
  const result = await remark()
    .use(remarkLintHeadingCapitalization, {
      allowFirstWordLowerCase: false,
      lowerCaseWords: ['the']
    })
    .process('# the Quick Brown Fox')
  assert.strictEqual(result.messages.length, 1)
})

test('[cache] Add title to cache', async () => {
  const result = await remark()
    .use(remarkLintHeadingCapitalization, {
      allowFirstWordLowerCase: true,
      lowerCaseWords: ['foo']
    })
    .process('# foo Bar Baz')

  assert.strictEqual(result.messages.length, 0)
})

test('[cache] change option flag and make sure cache does not persist', async () => {
  const result = await remark()
    .use(remarkLintHeadingCapitalization, {
      allowFirstWordLowerCase: false,
      // flag is now false while the rest remains the same, so we expect an error.
      // Cache must be invalidated for this to pass

      // NOTE: I'm not sure if it may also be necessary to invalidate cache in a non-test scenario.
      // For now, this is just a test to ensure that the cache is not persisting across different runs with different options.
      lowerCaseWords: ['foo']
    })
    .process('# foo Bar Baz')

  assert.match(
    result.messages[0].reason,
    /Heading capitalization error. Expected: 'Foo Bar Baz' found: 'foo Bar Baz'/
  )
})

test('[cache] cache persistance', async () => {
  // We clear cache after each test, so to properly test it we must process the same title multiple times in the same test.

  const duplicatedTitle = 'Foo bar Baz'
  const otherTitle = 'Another Random Title'

  const same1 = `# ${duplicatedTitle}`
  const same2 = `## ${duplicatedTitle}`

  const other = `# ${otherTitle}`

  // Process document with repeated headings
  await remark().use(remarkLintHeadingCapitalization, {
    lowerCaseWords: ['bar']
  }).process(`${same1}
${same1}
${other}
${same1}
`)

  // Should contain both 'Foo bar Baz' and 'Another Random Title'
  const keys = Object.keys(cache)
  assert(keys.includes(duplicatedTitle))
  assert(keys.includes(otherTitle))
  assert.strictEqual(keys.length, 2)

  // Process again with different heading levels
  await remark().use(remarkLintHeadingCapitalization, {
    lowerCaseWords: ['bar']
  }).process(`${same2}
${same2}
${other}
${same2}
`)

  const keys2 = Object.keys(cache)
  assert(keys2.includes(duplicatedTitle))
  assert(keys2.includes(otherTitle))
  assert.strictEqual(keys2.length, 2)
})
