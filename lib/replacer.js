'use strict';

const fs = require('fs-extra');
let replacementData = [];

/**
 * 初期化
 * @param {String} target 置換リストCSVのファイルパスまたは置換リストそのもの
 */
const init = async (target) => {
	if (Array.isArray(target)) {
		replacementData = target; // リストそのものが渡されたとき
	} else {
		await getFile(target); // ファイルパスが渡されたとき
	}
}

/**
 * 設定ファイルを取得
 * @param {String} file 置換リストCSVのファイルパス
 * @return {promise}
 */
const getFile = (file) => {
	return new Promise((resolve, reject) => {
		fs.readFile(file, 'utf-8', (err, data) => {
			if (err) { reject( new Error(`Cannot read ${file}`) ); return; }
			let replacement = data;
			let lists = replacement.split(/\r?\n/);
			lists.forEach((list, i) => {
				let pair = list.split(',');
				replacementData.push(pair);
			});
			resolve();
		});
	});
}

/**
 * 置換リストの内容を順に置換する
 * @param {String} str 置換対象の文字列
 * @return {promise} 置換リストの内容が全て置換された文字列
 */
const replace = (str, arr) => {
	let replacementList = arr !== void (0) ? arr : replacementData;
	replacementList.forEach(function(pairs){
		let before = pairs[0];
		let after = pairs[1];
		let reg = new RegExp(before, 'g');
		str = str.replace(reg, after);
	});
	return str;
}

module.exports = {
	init: init,
	replace: replace
}
