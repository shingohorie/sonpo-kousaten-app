'use strict';

// dependencies.
const fs = require('fs-extra');
const delimiter = /\t/;

// カラム行を格納
let columns = [];

 /**
  * 初期化
  * @param {String} target TSVのファイルパスまたはTSVデータそのもの
  * @param {Object} opt オプション（カラムを指定）
  */
const parse = async (target, opt) => {
	let result = [];
	columns = opt && opt.columns ? opt.columns : [];
	try {
		let stats = fs.statSync(target);
		if (stats.isFile()) result = await getFile(target); // ファイルパスが渡されたとき
		return result;
	} catch (err) {
		if (delimiter.test(target)) result = __parse(target);　// 直接文字列が渡されたとき
		return result;
	}
}

/**
 * 設定ファイルを取得
 * @param {String} file TSVのファイルパス
 * @return {promise}
 */
const getFile = (file) => {
	return new Promise((resolve, reject) => {
		fs.readFile(file, 'utf-8', (err, tsv) => {
			if (err) { reject(`${file} is not found.`); return; }
			let result = delimiter.test(tsv) ? __parse(tsv) : [];
			resolve(result);
		});
	});
}

/**
 * パース：TSVをオブジェクトの配列形式にパース
 * @param {String} tsv タブと改行コード区切りの文字列
 * @return {promise}
 */
const __parse = (tsv) => {
	let records = tsv.split(/\r?\n/);
	let tmp = [];
	records.forEach((record, i) => {
		let obj = {};
		let data = record.split(delimiter);
		data.forEach((d, i) => { 
			let key = columns.length ? columns[i] : d;
			obj[key] = d;
		});
		tmp.push(obj);
	});
	return tmp;
}

module.exports = {
	parse: parse
}