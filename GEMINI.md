The project
-----------

KSeF-JS is a framework-agnostic library for accessing KSeF API 2.0

* https://api.ksef.mf.gov.pl/docs/v2/index.html
* https://api-test.ksef.mf.gov.pl/docs/v2/index.html
* https://ksef.podatki.gov.pl/

Coding standards
----------------

* use compact style
* do not generate bload
* do not write fallbacks unlsess asked
* apply SoC rules
* every public class should have own file
* private classess for composition should be placed in the file with public class
* ES2025
* NO TYPESCRIPT
* almost no-dependency implementation, no frameworks
* rely only on transport libraries like axios
* avoid lodash when possible
* indentation: 4 spaces (no tabs)
* use linter to clean and lint the code
