'use strict';

// dependencies.
const nqdm = require('nqdm');

// source getter
const sourceGetter = require('./lib/sourceGetter');
// UTF-8 converter
const utf8Converter = require('./lib/utf8Converter');

// 移行対象ディレクトリ
const baseDir = ['./js'];
// 除外ディレクトリ
const exclusion = [];
// 移行元ページのパスを格納
let sources = [];

/**
 * 受け取ったパスの配列から、文字コードを変換して上書く
 * @param {Array} sources 変換元のパス
 */
const convert = (sources)=> {
	let progressbar = nqdm(sources.length);

	let __convert = async (i) => {
		progressbar.process();
		if (i < sources.length) {
			await utf8Converter.convert(sources[i], 'shift-jis');
			__convert(i+1);
		}
	}

	__convert(0);
}

// 実行
const main = async () => {
	sources = await sourceGetter.get( baseDir, {
		ext: 'js',
		exclusion: exclusion
	});
	sources = sources.map((source) => {
		return source.path;
	});
	convert(sources);
}

main();