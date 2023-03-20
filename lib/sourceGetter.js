'use strict';
// dependencies.
const fl = require('node-filelist');

let exclusion = [];
let ext;
let results = [];

/**
 * 指定されたディレクトリ配下のファイルのパスを取得する
 * @param {String} baseDir 置換リストTSVのファイルパスまたは置換リストそのもの
 * @param {Object} opt オプション（拡張子・除外ディレクトリを指定）
 * @return {promise}
 */
const get = (baseDir, opt) => {
	exclusion = opt.exclusion;
	ext = opt.ext;

	return new Promise((resolve, reject) => {
		fl.read(baseDir, {'ext': opt.ext }, (res) => {
			res.forEach((res) => {
				if (__isTarget(res.path)) results.push(res);
			});
			resolve(results);
		});
	});
}

/**
 * 対象となるファイルであるか（除外ディレクトリ配下のファイルでないか）検査をする
 * @param {String} path 置換リストTSVのファイルパスまたは置換リストそのもの
 * @return {Boolean} 対象となるファイルであれば true
 */
const __isTarget = (path) => {
	return !exclusion.some((ele) => {
		return new RegExp(ele).test(path);
	});
}

module.exports = {
	get: get
}