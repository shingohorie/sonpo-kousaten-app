'use strict';

// dependencies.
const fs = require('fs-extra');
const iconv = require('iconv-lite');

/**
 * 受け取ったパスを読み込み、同名でUTF-8として上書きをする
 * @param {String} oldPath 変換元のパス
 * @param {String} oldChar 変換元のエンコーディング
 * @param {String} newPath 変換後のパス（省略時は上書き）
 * @return {promise}
 */
const convert = (oldPath, oldChar, newPath) => {
	let outputPath = newPath || oldPath;
	let regexCharset;

	switch (oldChar) {
		case 'shift-jis':
			oldChar = 'windows-31j'; 
			regexCharset = /(Shift_JIS|shift_jis)/;
			break;
		case 'euc-jp': 
			oldChar = 'euc-jp'; 
			regexCharset = /(EUC-JP|euc-jp)/;
			break;
	}
	
	return new Promise((resolve, reject) => {
		// 移行元HTMLを取得
		fs.readFile(oldPath, (err, data) => {
			if (err) { reject(`Can't read file : ${oldPath}`); return; }
			// 旧文字コードら変換後、改行やタブを削除して整形
			let stringData = iconv.decode(data, oldChar).replace(regexCharset, 'utf-8');
			resolve(stringData);
		});
	}).then((stringData) => {
		return new Promise((resolve, reject) => {
			fs.outputFile(outputPath, stringData, 'utf8', (err) => { resolve(); });
		})
	})
}

module.exports = {
    convert: convert
}