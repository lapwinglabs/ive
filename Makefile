test:
	@node_modules/.bin/mocha

browser:
	@node_modules/.bin/duo-serve -h test/index.html -g Schema index.js

dist: components dist-build dist-minify

dist-build:
	@mkdir -p dist/
	@duo -g Ive < index.js > dist/ive.js

dist-minify: dist/ive.js
	@curl -s \
		-d compilation_level=SIMPLE_OPTIMIZATIONS \
		-d output_format=text \
		-d output_info=compiled_code \
		--data-urlencode "js_code@$<" \
		http://marijnhaverbeke.nl/uglifyjs \
		> $<.tmp
	@mv $<.tmp dist/ive.min.js

clean:
	@rm -rf node_modules
	@rm -rf components

.PHONY: test browser dist
