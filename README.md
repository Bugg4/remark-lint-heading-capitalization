# remark-lint-heading-capitalization

[remark-lint](https://github.com/remarkjs/remark-lint) plugin to ensure that your Markdown headings capitalization is correct.

1. Capitalize the first word, as well as all nouns, pronouns, verbs, adjectives, and adverbs.
2. Articles, conjunctions, and prepositions should remain lowercase.
3. Capitalize the first element in a hyphenated compound. The other elements are generally capitalized unless they are articles, conjunctions, or prepositions.

Some additional points to note:

- The plugin only checks the first letter of words that require capitalization.
- Words written in uppercase are automatically skipped by the plugin.

## Install

```sh
npm install remark-lint-heading-capitalization
```

## Usage

Use like any other [remark-lint](https://github.com/remarkjs/remark-lint) plugin.
Check out the [remark-lint](https://github.com/remarkjs/remark-lint) documentation for details.

### Options

Configuration (TypeScript type).

- `lowerCaseWords` (`string[]`, optional, example: `['die', 'der', 'und']`)
  — extends the default list of lowercase words.

- `ignorePattern` (`string | string[]`, optional, example: `'package-[a-z]+'` or `['package-[a-z]+', 'node-[0-9]+']`)
  — a single regular expression pattern as a string or an array of strings, used to ignore items that match the specified pattern(s).

- `allowFirstWordLowerCase` (`boolean`, default: `false`)

  - `true`: Allows the first word of a heading to be lowercase, but **only** if that word is explicitly listed in your custom `lowerCaseWords` array.

    Words from the default lowercase list (such as "a", "the", "and", etc.) will **not** be allowed as a lowercase first word unless you add them to your custom list.

  - `false`: The first word is always capitalized unless it is already all uppercase.

  With this configuration, a heading like `die besten Tricks` or `the quick brown fox` will not be flagged, but `an apple` will still be flagged unless `"an"` is added to `lowerCaseWords`.

## Examples

When this rule is turned on, the following `valid.md` is ok:

```md
## Where to Ask Questions
## An Apple
## Enable 2FA on GitHub
## Flight-or-Fight
```

When this rule is turned on, the following `invalid.md` is **not** ok:

```md
## Where To Ask questions
## an Apple
## Enable 2FA On GitHub
## Flight-Or-fight
```

```text
1:1-1:26 warning Heading capitalization error. Expected: 'Where to Ask Questions' found: 'Where To Ask questions' heading-capitalization remark-lint

2:1-2:12 warning Heading capitalization error. Expected: 'An Apple' found: 'an Apple'                             heading-capitalization remark-lint

3:1-3:24 warning Heading capitalization error. Expected: 'Enable 2FA on GitHub' found: 'Enable 2FA On GitHub'     heading-capitalization remark-lint

4:1-4:19 warning Heading capitalization error. Expected: 'Flight-or-Fight' found: 'Flight-Or-fight'               heading-capitalization remark-lint
```

## Support the Project

If you find this tool helpful, consider supporting us:

- [**Support Our Work**](https://ilyatitov.vercel.app/payments)
